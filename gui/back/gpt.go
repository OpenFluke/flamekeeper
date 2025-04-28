package main

import "go.mongodb.org/mongo-driver/bson/primitive"

type GPT struct {
	ID          primitive.ObjectID `json:"id,omitempty" bson:"_id,omitempty"`
	Name        string             `json:"name" bson:"name" validate:"required"`
	Description string             `json:"description" bson:"description" validate:"required"`
	ProjectID   string             `json:"projectid" bson:"projectid"`
}
