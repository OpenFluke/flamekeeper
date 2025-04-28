package main

import (
	"context"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func CreateGPT(c *fiber.Ctx) error {
	// Parse the incoming request
	gpt := new(GPT)
	if err := c.BodyParser(gpt); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request payload",
			"error":   err.Error(),
		})
	}

	// Validate required fields
	if gpt.Name == "" || gpt.Description == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Name and description are required",
		})
	}

	// Generate projectid from name
	gpt.ProjectID = strings.ToLower(strings.ReplaceAll(gpt.Name, " ", "-"))

	// Check if a GPT with the same name already exists
	collection := MI.DB.Collection("gpts")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existingGPT GPT
	err := collection.FindOne(ctx, bson.M{"name": gpt.Name}).Decode(&existingGPT)
	if err != nil && err != mongo.ErrNoDocuments {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Error checking existing GPT",
			"error":   err.Error(),
		})
	}

	if err != mongo.ErrNoDocuments {
		// GPT with the same name exists
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"success":   false,
			"message":   "A GPT with this name already exists",
			"canCreate": false,
		})
	}

	// Insert the new GPT
	_, err = collection.InsertOne(ctx, gpt)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to create GPT",
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success":   true,
		"message":   "GPT created successfully",
		"canCreate": true,
		"projectid": gpt.ProjectID,
	})
}

func GetProjects(c *fiber.Ctx) error {
	// Access the gpts collection
	collection := MI.DB.Collection("gpts")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Find all GPTs
	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Error fetching projects",
			"error":   err.Error(),
		})
	}
	defer cursor.Close(ctx)

	// Decode the results into a slice of GPTs
	var projects []GPT
	if err := cursor.All(ctx, &projects); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Error decoding projects",
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":  true,
		"projects": projects,
	})
}

// Updated endpoint to update a project using projectid
func UpdateGPT(c *fiber.Ctx) error {
	projectID := c.Params("id")

	// Parse the incoming request
	updateData := new(GPT)
	if err := c.BodyParser(updateData); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request payload",
			"error":   err.Error(),
		})
	}

	// Create update fields
	update := bson.M{
		"$set": bson.M{
			"description":  updateData.Description,
			"model":        updateData.Model,
			"instructions": updateData.Instructions,
		},
	}

	// Update the project in MongoDB
	collection := MI.DB.Collection("gpts")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.UpdateOne(ctx, bson.M{"projectid": projectID}, update)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to update project",
			"error":   err.Error(),
		})
	}

	if result.MatchedCount == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "Project not found",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Project updated successfully",
	})
}

// Updated endpoint to delete a project using projectid
func DeleteGPT(c *fiber.Ctx) error {
	projectID := c.Params("id")

	// Delete the project from MongoDB
	collection := MI.DB.Collection("gpts")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := collection.DeleteOne(ctx, bson.M{"projectid": projectID})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to delete project",
			"error":   err.Error(),
		})
	}

	if result.DeletedCount == 0 {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "Project not found",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Project deleted successfully",
	})
}
