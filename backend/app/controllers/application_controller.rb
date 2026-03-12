class ApplicationController < ActionController::API
  # On dit à Rails : "Avant chaque action de l'API, lance la fonction allow_request!"
  before_action :allow_request!

  private

  # La fonction secrète pour générer un Token (carte d'identité) quand un user se connecte
  def encode_token(payload)
    # Dans la vraie vie, on utiliserait une variable d'environnement très sécurisée.
    # Pour le challenge, on va prendre un mot de passe simple (ici : "dabadoc_secret").
    JWT.encode(payload, 'dabadoc_secret')
  end

  # La fonction qui lit l'en-tête (Header) de la requête envoyée par le futur Front-end
  def auth_header
    # Le front-end enverra : Authorization: Bearer <mon_token>
    request.headers['Authorization']
  end

  # La fonction qui décode la carte d'identité s'il y en a une
  def decoded_token
    if auth_header
      # On enlève le mot "Bearer " pour ne garder que le token
      token = auth_header.split(' ')[1]
      begin
        JWT.decode(token, 'dabadoc_secret', true, algorithm: 'HS256')
      rescue JWT::DecodeError
        nil # Si le token est faux ou expiré, on renvoie "rien"
      end
    end
  end

  # Qui est connecté en ce moment ? 
  def current_user
    if decoded_token
      user_id = decoded_token[0]['user_id']
      @user = User.find_by(id: user_id)
    end
  end

  # Demande-t-on à quelqu'un d'être connecté ?
  def logged_in?
    !!current_user
  end

  # Le fameux "videur" appelé tout au début (ligne 3). Il bloque l'accès si c'est faux !
  def allow_request!
    unless logged_in?
      render json: { message: 'Veuillez vous connecter pour faire cette action' }, status: :unauthorized
    end
  end
end
