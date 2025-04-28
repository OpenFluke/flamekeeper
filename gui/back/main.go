package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	// Connect to MongoDB
	if err := ConnectDB(); err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}
	defer DisconnectDB()

	// Create Fiber app
	app := fiber.New()

	// Add CORS middleware to allow traffic from all origins
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders: "Content-Type",
	}))

	// Setup routes
	app.Post("/api/gpt", CreateGPT)
	app.Get("/api/projects", GetProjects) // Ensure this route is defined

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}
	log.Fatal(app.Listen(":" + port))
}
