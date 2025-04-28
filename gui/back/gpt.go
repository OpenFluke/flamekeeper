package main

import "go.mongodb.org/mongo-driver/bson/primitive"

type GPT struct {
	ID           primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	Name         string             `json:"name" bson:"name" validate:"required"`
	Description  string             `json:"description" bson:"description" validate:"required"`
	ProjectID    string             `json:"projectid" bson:"projectid"`
	Model        string             `json:"model" bson:"model"`               // New field for Ollama model
	Instructions string             `json:"instructions" bson:"instructions"` // New field for instructions
}
