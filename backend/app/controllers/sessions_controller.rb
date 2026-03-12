class SessionsController < ApplicationController
  # Comme pour l'inscription, on laisse passer le login sans demander de Token !
  skip_before_action :allow_request!, only: [:create]

  def create
    # 1. On cherche l'utilisateur dans la base MongoDB avec son email
    @user = User.find_by(email: params[:email])

    # 2. S'il existe ET que le mot de passe correspond
    if @user && @user.authenticate(params[:password])
      
      # 3. C'est gagné, on lui génère son Token
      token = encode_token({ user_id: @user.id.to_s })
      
      # 4. On renvoie les données à Angular
      render json: { 
        user: @user.as_json(except: [:password_digest]),
        token: token 
      }, status: :ok
    
    else
      render json: { error: 'Email ou mot de passe invalide' }, status: :unauthorized
    end
  end
end
