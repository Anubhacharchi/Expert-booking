import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ExpertCard.css';

const categoryColors = {
  Technology: '#6c63ff',
  Business: '#f5c842',
  Design: '#ec4899',
  Marketing: '#f97316',
  Finance: '#22c55e',
  Health: '#06b6d4',
  Legal: '#a78bfa',
  Education: '#fb923c'
};

const categoryIcons = {
  Technology: '💻',
  Business: '📊',
  Design: '🎨',
  Marketing: '📢',
  Finance: '💰',
  Health: '🏥',
  Legal: '⚖️',
  Education: '📚'
};

const StarRating = ({ rating }) => {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          className={`star ${i <= Math.round(rating) ? 'filled' : ''}`}
        >★</span>
      ))}
      <span className="rating-value">{rating.toFixed(1)}</span>
    </div>
  );
};

const ExpertCard = ({ expert }) => {
  const navigate = useNavigate();
  const color = categoryColors[expert.category] || '#6c63ff';
  const icon = categoryIcons[expert.category] || '👤';

  return (
    <div
      className="expert-card"
      onClick={() => navigate(`/experts/${expert._id}`)}
      style={{ '--card-accent': color }}
    >
      <div className="card-glow" />

      <div className="card-header">
        <div className="expert-avatar-wrap">
          {expert.profileImage ? (
            <img
              src={expert.profileImage}
              alt={expert.name}
              className="expert-avatar"
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
            />
          ) : null}
          <div className="expert-avatar-fallback" style={{ display: expert.profileImage ? 'none' : 'flex' }}>
            {expert.name.charAt(0)}
          </div>
        </div>
        <div className="category-badge" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
          <span>{icon}</span> {expert.category}
        </div>
      </div>

      <div className="card-body">
        <h3 className="expert-name">{expert.name}</h3>
        <StarRating rating={expert.rating} />
        {expert.totalReviews > 0 && (
          <span className="review-count">({expert.totalReviews} reviews)</span>
        )}

        <p className="expert-bio">{expert.bio.substring(0, 110)}...</p>

        <div className="expert-meta">
          <div className="meta-item">
            <span className="meta-icon">🏆</span>
            <span>{expert.experience}y exp</span>
          </div>
          {expert.skills && expert.skills.slice(0, 2).map(skill => (
            <div key={skill} className="skill-tag">{skill}</div>
          ))}
        </div>
      </div>

      <div className="card-footer">
        <div className="rate-display">
          <span className="rate-amount">${expert.hourlyRate}</span>
          <span className="rate-label">/session</span>
        </div>
        <button className="book-btn">Book Now →</button>
      </div>
    </div>
  );
};

export default ExpertCard;
