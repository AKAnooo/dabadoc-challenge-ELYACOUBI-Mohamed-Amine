class User
  include Mongoid::Document
  include Mongoid::Timestamps
  include ActiveModel::SecurePassword 
  
  has_secure_password

  field :email, type: String
  field :password_digest, type: String
  field :latitude, type: Float
  field :longitude, type: Float
end
