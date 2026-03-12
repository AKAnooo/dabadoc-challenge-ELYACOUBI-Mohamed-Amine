class QuestionsController < ApplicationController
  # Fonctionnalité 5 : Lister les questions par distance
  def index
    # On imagine qu'Angular nous envoie la position actuelle du User dans l'URL (?lat=48.8&lng=2.3)
    if params[:lat].present? && params[:lng].present?
      # La magie de Geocoder : ".near" trie de la plus proche à la plus lointaine !
      @questions = Question.near([params[:lat], params[:lng]], 50, units: :km) # Rayon de 50km
    else
      # Si pas de coordonnées, on renvoie toutes les questions, par date (plus récentes d'abord)
      @questions = Question.all.order(created_at: :desc)
    end

    render json: @questions, include: [:user, :answers, :likes]
  end

  # Fonctionnalité 3 : Poser une question
  def create
    # "current_user" est la variable fournie par notre ApplicationController si le Token JWT est bon !
    @question = current_user.questions.build(question_params)

    if @question.save
      render json: @question, status: :created
    else
      render json: { errors: @question.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # Fonctionnalité 6 : Liker une question
  def like
    @question = Question.find(params[:id])
    # On crée le Like en associant le current_user et la question
    @like = @question.likes.find_or_create_by(user: current_user)
    
    render json: { message: 'Question ajoutée aux favoris', question: @question }, status: :ok
  end

  # Fonctionnalité 8 : Enlever le like d'une question
  def unlike
    @question = Question.find(params[:id])
    # On cherche le Like de cet utilisateur sur cette question et on le détruit
    @like = @question.likes.find_by(user: current_user)
    @like&.destroy
    
    render json: { message: 'Question retirée des favoris' }, status: :ok
  end

  private

  # On autorise Angular à nous envoyer un titre, un contenu et les fameuses coordonnées
  def question_params
    params.require(:question).permit(:title, :body, :latitude, :longitude)
  end
end
