class QuestionsController < ApplicationController
  # Fonctionnalité 5 : Lister les questions par distance ou date
  def index
    # Si on ne demande pas explicitement "recent" ET qu'on a des coordonnées
    if params[:sort] != 'recent' && params[:lat].present? && params[:lng].present?
      user_coords = [params[:lat].to_f, params[:lng].to_f]
      
      # On charge toutes les questions et on les trie par distance en Ruby,
      # puis par date de création (les plus récentes en premier pour une même distance)
      @questions = Question.all.to_a.sort_by do |q|
        distance = if q.latitude && q.longitude
                     Geocoder::Calculations.distance_between([q.latitude, q.longitude], user_coords)
                   else
                     Float::INFINITY # Les questions sans coordonnées vont à la fin
                   end
        
        # Le -q.created_at.to_i permet de trier par les plus récentes d'abord en cas d'égalité
        [distance, -q.created_at.to_i]
      end
    else
      # Tri par date de création pure (le plus récent en haut)
      @questions = Question.all.order(created_at: :desc)
    end

    # On construit une réponse JSON enrichie avec le statut "liked" pour le user actuel
    questions_json = @questions.map do |q|
      # On inclut le user de la question, ET le user de chaque réponse !
      v = q.as_json(include: [
        :user, 
        :likes,
        { answers: { include: :user } }
      ])
      v[:liked] = q.likes.exists?(user: current_user)
      v
    end

    render json: questions_json
  end

  # Fonctionnalité 7 : Afficher les favoris
  def favorites
    # On récupère les IDs des questions que l'utilisateur a liké (attention au polymorphisme)
    liked_question_ids = current_user.likes.where(likeable_type: 'Question').pluck(:likeable_id)
    
    # On trouve ces questions et on les trie par date de création (plus récentes en premier)
    @favorite_questions = Question.in(id: liked_question_ids).order(created_at: :desc)
    
    questions_json = @favorite_questions.map do |q|
      v = q.as_json(include: [
        :user, 
        :likes,
        { answers: { include: :user } }
      ])
      v[:liked] = true # Forcément true puisqu'on est dans les favoris
      v
    end

    render json: questions_json
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

  # Nouvelle Fonctionnalité : Supprimer sa propre question
  def destroy
    @question = Question.find(params[:id])
    
    if @question.user == current_user
      @question.destroy
      render json: { message: 'Question supprimée avec succès' }, status: :ok
    else
      render json: { error: 'Non autorisé' }, status: :unauthorized
    end
  end

  private

  # On autorise Angular à nous envoyer un titre, un contenu et les fameuses coordonnées
  def question_params
    params.require(:question).permit(:title, :body, :latitude, :longitude)
  end
end
