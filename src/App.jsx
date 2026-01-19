import React, { useReducer, useEffect, useCallback } from "react";
import SelectField from "./components/Select";
import listOfGenreOption from "./store/genre.json";
import listOfMoodOption from "./store/mood.json";

const initialState = {
  genre: "",
  mood: "",
  level: "",
  aiResponses: [],
  loading: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET_MOOD":
      return { ...state, mood: "" };
    case "START_LOADING":
      return { ...state, loading: true };
    case "ADD_RESPONSE":
      return {
        ...state,
        aiResponses: [action.payload, ...state.aiResponses],
        loading: false,
      };
    case "STOP_LOADING":
      return { ...state, loading: false };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { genre, mood, level, aiResponses, loading } = state;

  
  useEffect(() => {
    dispatch({ type: "RESET_MOOD" });
  }, [genre]);

  // 3. useCallback: Memoize the API call
  const fetchRecommendations = useCallback(async () => {
    if (!genre || !mood || !level) {
      alert("Please fill in all selections!");
      return;
    }

    dispatch({ type: "START_LOADING" });

    try {
      const API_KEY = "AIzaSyBtZKNSqTojzJwOsBR-7yR54IlGIfkPoOY"; 
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Recommend 6 books for a ${level} ${genre} reader feeling ${mood}. Explain why.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      
      // Accessing the specific Gemini response path
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (resultText) {
        dispatch({ type: "ADD_RESPONSE", payload: resultText });
      } else {
        throw new Error("Invalid API Response");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      alert("Failed to get recommendations. Check your API key or connection.");
      dispatch({ type: "STOP_LOADING" });
    }
  }, [genre, mood, level]);

  // Determine which moods to show based on the selected genre
  const availableMoods = listOfMoodOption[genre] || [];

  return (
    <section style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1>AI Book Recommender</h1>

      <SelectField
        id="genre"
        placeholder="Select a genre"
        options={listOfGenreOption}
        value={genre}
        onSelect={(val) => dispatch({ type: "SET_FIELD", field: "genre", value: val })}
      />

      <SelectField
        id="mood"
        placeholder="Select a mood"
        options={availableMoods}
        value={mood}
        onSelect={(val) => dispatch({ type: "SET_FIELD", field: "mood", value: val })}
      />

      <SelectField
        id="level"
        placeholder="Select your reading level"
        options={["Beginner", "Intermediate", "Expert"]}
        value={level}
        onSelect={(val) => dispatch({ type: "SET_FIELD", field: "level", value: val })}
      />

      <button 
        onClick={fetchRecommendations} 
        disabled={loading}
        style={{ width: "100%", padding: "10px", cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Searching for books..." : "Get Recommendations"}
      </button>

      <hr style={{ margin: "20px 0" }} />

      <div className="results">
        {aiResponses.map((text, index) => (
          <details key={index} style={{ marginBottom: "15px", border: "1px solid #ddd", padding: "10px" }}>
            <summary style={{ fontWeight: "bold", cursor: "pointer" }}>
              Recommendation List {aiResponses.length - index}
            </summary>
            {/* pre-wrap preserves the AI's formatting and line breaks */}
            <p style={{ whiteSpace: "pre-wrap", marginTop: "10px" }}>{text}</p>
          </details>
        ))}
      </div>
    </section>
  );
}