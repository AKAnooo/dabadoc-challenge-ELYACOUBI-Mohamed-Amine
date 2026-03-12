class Question
  include Mongoid::Document
  include Mongoid::Timestamps
  
  # C'est cette ligne magique qui active les calculs de distance !
  include Geocoder::Model::Mongoid 
  
  field :title, type: String
  field :body, type: String
  
  field :latitude, type: Float
  field :longitude, type: Float
  
  belongs_to :user
  embeds_many :answers
  has_many :likes, as: :likeable, dependent: :destroy

  # On dit à Geocoder sur quels champs se baser pour faire ses calculs
  reverse_geocoded_by :coordinates

  # Mongoid a besoin des coordonnées sous forme d'un tableau [longitude, latitude] pour faire des maths
  def coordinates
    [longitude, latitude]
  end
end
