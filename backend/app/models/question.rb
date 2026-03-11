class Question
  include Mongoid::Document
  include Mongoid::Timestamps
  field :title, type: String
  field :body, type: String
  belongs_to :user
  embeds_many :answers

  has_many :likes, as: :likeable, dependent: :destroy
end
