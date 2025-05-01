package main

import (
	"context"
	"log"
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

func EmbedChunk(c *fiber.Ctx) error {
	projectID := c.Params("projectid")

	var chunk EmbeddedChunk
	if err := c.BodyParser(&chunk); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid payload",
			"error":   err.Error(),
		})
	}

	if chunk.ID == "" || chunk.Text == "" || len(chunk.Embedding) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "ID, text, and embedding are required",
		})
	}

	collectionName := "gpt_embed_" + projectID
	collection := MI.DB.Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Ensure uniqueness by ID
	_, err := collection.InsertOne(ctx, chunk)
	if err != nil {
		if mongo.IsDuplicateKeyError(err) {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"success": false,
				"message": "Chunk ID already exists",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to insert chunk",
			"error":   err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Chunk embedded successfully",
	})
}

func ReplaceEmbeddings(c *fiber.Ctx) error {
	projectID := c.Params("projectid")

	var body struct {
		Chunks []EmbeddedChunk `json:"chunks"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid payload",
			"error":   err.Error(),
		})
	}

	collectionName := "gpt_embed_" + projectID
	collection := MI.DB.Collection(collectionName)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 1. Delete all existing chunks
	_, err := collection.DeleteMany(ctx, bson.M{})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to clear existing embeddings",
			"error":   err.Error(),
		})
	}

	// 2. Insert new chunks
	docs := make([]interface{}, len(body.Chunks))
	for i, chunk := range body.Chunks {
		docs[i] = chunk
	}

	if len(docs) > 0 {
		_, err = collection.InsertMany(ctx, docs)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"message": "Failed to insert new embeddings",
				"error":   err.Error(),
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success":  true,
		"message":  "Embeddings replaced successfully",
		"replaced": len(docs),
	})
}

func DeleteAllEmbeddings(c *fiber.Ctx) error {
	projectID := c.Params("projectid")
	collectionName := "gpt_embed_" + projectID

	log.Println("DROP called for collection:", collectionName)

	collection := MI.DB.Collection(collectionName)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := collection.Drop(ctx); err != nil {
		log.Println("Error dropping collection:", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to drop collection",
			"error":   err.Error(),
		})
	}

	log.Println("Successfully dropped collection:", collectionName)

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Collection dropped",
	})
}
