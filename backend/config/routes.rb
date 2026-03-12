Rails.application.routes.draw do
  
  # Le grand bloc des questions et tout ce qui s'y rattache :
  resources :questions, only: [:index, :create] do
    # Les URL pour Liker/Unliker une question précise
    member do
      post :like
      delete :unlike
    end
    # L'URL pour poster une réponse reliée à une question
    resources :answers, only: [:create]
  end

  # Les routes que tu as déjà :
  post "/signup", to: "users#create"
  post "/login", to: "sessions#create"
  get "up" => "rails/health#show", as: :rails_health_check
end
