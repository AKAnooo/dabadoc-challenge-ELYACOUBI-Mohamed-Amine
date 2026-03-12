class QuestionsController < ApplicationController
  # Fonctionnalité 5 : Lister les questions par distance
  def index
    if params[:lat].present? && params[:lng].present?
      user_coords = [params[:lat].to_f, params[:lng].to_f]
      
      # On charge toutes les questions et on les trie par distance en Ruby
      @questions = Question.all.to_a.sort_by do |q|
        if q.latitude && q.longitude
          Geocoder::Calculations.distance_between([q.latitude, q.longitude], user_coords)
        else
          Float::INFINITY # Les questions sans coordonnées vont à la fin
        end
      end
    else
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
