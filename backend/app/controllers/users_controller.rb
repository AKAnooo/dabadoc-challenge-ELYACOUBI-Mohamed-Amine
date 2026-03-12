class UsersController < ApplicationController
  # On laisse passer l'action d'inscription sans demander de Token
  skip_before_action :allow_request!, only: [:create]

  def create
    @user = User.new(user_params)

    if @user.save
      token = encode_token({ user_id: @user.id.to_s })
      render json: {
        user: @user.as_json(except: [:password_digest]),
        token: token
      }, status: :created
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :latitude, :longitude)
  end
end
