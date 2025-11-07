import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle } from 'lucide-react';

const Feedback: React.FC = () => {
  const [email, setEmail] = useState('');
  const [complaint, setComplaint] = useState('');
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !complaint) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/feedback/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          complaint,
          rating
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setEmail('');
        setComplaint('');
        setRating(5);
      } else {
        const error = await response.json();
        let errorMessage = error.error || 'Failed to submit feedback';
        
        // Show validation details if available
        if (error.details && Array.isArray(error.details)) {
          const validationErrors = error.details.map((d: any) => d.message).join(', ');
          errorMessage += ': ' + validationErrors;
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="card-content text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2>Thank You!</h2>
            <p>Your feedback has been submitted successfully.</p>
            <button 
              className="btn btn-primary mt-4"
              onClick={() => setSubmitted(false)}
            >
              Submit Another Feedback
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          <div>
            <h1>Feedback</h1>
            <p>Help us improve SentinelVault with your feedback</p>
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="card max-w-2xl mx-auto">
          <div className="card-header">
            <h3>Submit Feedback</h3>
          </div>
          <div className="card-content">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="rating" className="form-label">
                  Rating
                </label>
                <div className="rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star ${star <= rating ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-text">({rating}/5)</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="complaint" className="form-label">
                  Your Feedback
                </label>
                <textarea
                  id="complaint"
                  className="form-textarea"
                  rows={6}
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Please share your thoughts, suggestions, or report any issues..."
                  required
                  minLength={10}
                />
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)', marginTop: 'var(--space-1)' }}>
                  Minimum 10 characters ({complaint.length}/10)
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;