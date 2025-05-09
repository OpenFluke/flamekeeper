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
	app.Get("/api/projects", GetProjects)
	app.Put("/api/gpt/:id", UpdateGPT)    // New route for updating a project
	app.Delete("/api/gpt/:id", DeleteGPT) // New route for deleting a project

	app.Post("/api/gpt/:projectid/embed", EmbedChunk)
	app.Post("/api/gpt/:projectid/embed/replace", ReplaceEmbeddings)
	app.Delete("/api/gpt/:projectid/embed", DeleteAllEmbeddings)

	app.Get("/test/:projectid", LoadTestPage)
	app.Post("/test/:projectid/ping", TestModelPing)
	app.Post("/test/:projectid/rag", TestRAGRetrieval)
	app.Post("/test/:projectid/query", RunFullPipeline)

	app.Get("/api/deploy/:projectid", GetSingleProject)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "4000"
	}
	log.Fatal(app.Listen(":" + port))
}
