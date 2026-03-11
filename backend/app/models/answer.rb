class Answer
  include Mongoid::Document
  include Mongoid::Timestamps
  field :body, type: String
  belongs_to :user
  embedded_in :question

  has_many :likes, as: :likeable, dependent: :destroy
end
