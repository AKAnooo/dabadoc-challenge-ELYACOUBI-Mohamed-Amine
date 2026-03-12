class AnswersController < ApplicationController
  # Fonctionnalité 4 : Créer une réponse
  def create
    # On retrouve la question à laquelle l'utilisateur veut répondre
    @question = Question.find(params[:question_id])
    
    # On crée la réponse "à l'intérieur" de la question, associée à l'utilisateur
    @answer = @question.answers.build(answer_params)
    @answer.user = current_user

    if @question.save # Sauvegarder la question sauvegarde la réponse encastrée !
      # On renvoie la réponse avec les infos de l'utilisateur pour le front
      render json: @answer.as_json(include: :user), status: :created
    else
      render json: { errors: @answer.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def answer_params
    params.require(:answer).permit(:body)
  end
end
