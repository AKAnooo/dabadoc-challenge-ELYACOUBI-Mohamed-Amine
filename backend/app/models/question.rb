class Question
  include Mongoid::Document
  include Mongoid::Timestamps
  field :title, type: String
  field :body, type: String
  
  # Coordonnées géographiques pour le tri par distance (Feature 5)
  field :latitude, type: Float
  field :longitude, type: Float
  belongs_to :user
  embeds_many :answers

  has_many :likes, as: :likeable, dependent: :destroy
end
