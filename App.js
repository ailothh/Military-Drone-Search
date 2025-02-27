import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState(""); // Track active section
  const [isViewingSection, setIsViewingSection] = useState(false); // Track if viewing a section
  const [suggestions, setSuggestions] = useState([]); // Track autocomplete suggestions

  // Fetch data from Wikipedia based on user input
  const fetchWikiData = async () => {
    if (!query) return;
    setError(null);
    setData(null);
    setSuggestions([]); // Clear suggestions when searching

    try {
      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${query}&format=json&origin=*`
      );
      const searchResults = await response.json();
      if (!searchResults.query.search.length) {
        setError("No results found.");
        return;
      }

      const match = searchResults.query.search[0];
      const pageResponse = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|categories&pageids=${match.pageid}&format=json&origin=*`
      );
      const pageData = await pageResponse.json();
      const page = pageData.query.pages[match.pageid];

      const extract = page.extract || "";

      const specs = {
        title: page.title,
        url: `https://en.wikipedia.org/?curid=${match.pageid}`,
        generalCharacteristics: extract.match(/General\s?characteristics[\s\S]*?<ul>[\s\S]*?<\/ul>/i)?.[0]?.replace(/^General\s?characteristics\s*/i, "") || "No details available",
        performance: extract.match(/(?<=General\s?characteristics[\s\S]*?)Performance[\s\S]*?<ul>[\s\S]*?<\/ul>/i)?.[0]?.replace(/^Performance\s*/i, "") || "No details available",
        armament: extract.match(/(?<=General\s?characteristics[\s\S]*?)Armament[\s\S]*?<ul>[\s\S]*?<\/ul>/i)?.[0]?.replace(/^Armament\s*/i, "") || "No details available",
        avionics: extract.match(/(?<=General\s?characteristics[\s\S]*?)Avionics[\s\S]*?<ul>[\s\S]*?<\/ul>/i)?.[0]?.replace(/^Avionics\s*/i, "") || "No details available"
      };

      setData(specs);
    } catch (err) {
      setError("Failed to fetch data. Please try again later.");
    }
  };

  // Autocomplete suggestions fetching
  const fetchSuggestions = async (query) => {
    if (query.length < 3) return; // Only fetch suggestions if query is long enough
    try {
      const response = await fetch(
        `https://en.wikipedia.org/w/api.php?action=opensearch&search=${query}&limit=5&namespace=0&format=json&origin=*`
      );
      const suggestionData = await response.json();
      setSuggestions(suggestionData[1]); // Set the suggestions
    } catch (err) {
      setSuggestions([]); // Handle any errors by clearing suggestions
    }
  };

  useEffect(() => {
    if (query) {
      fetchSuggestions(query); // Fetch suggestions when query changes
    } else {
      setSuggestions([]); // Clear suggestions if input is empty
    }
  }, [query]);

  const handleLinkClick = (section) => {
    setActiveSection(section); // Update active section
    setIsViewingSection(true); // Show the section view
  };

  const getSectionContent = () => {
    switch (activeSection) {
      case "generalCharacteristics":
        return data?.generalCharacteristics || "No details available";
      case "performance":
        return data?.performance || "No details available";
      case "armament":
        return data?.armament || "No details available";
      case "avionics":
        return data?.avionics || "No details available";
      default:
        return "";
    }
  };

  const handleBackClick = () => {
    setIsViewingSection(false); // Go back to the results
    setActiveSection(""); // Clear active section
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <h1 className="app-title">Military Systems Explorer</h1>
        <div className="search-bar-container">
          <input
            className="search-input"
            type="text"
            placeholder="Search for drones, satellites, or UUVs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="search-button" onClick={fetchWikiData}>
            Search
          </button>
          {/* Autocomplete Suggestions Dropdown */}
          {suggestions.length > 0 && (
            <ul className="suggestions-dropdown">
              {suggestions.map((suggestion, index) => (
                <li key={index} onClick={() => setQuery(suggestion)}>
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="results-container">
          {error && <p style={{ color: "red" }}>{error}</p>}
          {!isViewingSection && data && (
            <div className="result-item">
              <h2 className="result-title">{data.title}</h2>

              {/* Links for Specification Sections */}
              <div className="spec-links">
                <ul>
                  <li>
                    <button onClick={() => handleLinkClick("generalCharacteristics")} className="spec-link">
                      General Characteristics
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleLinkClick("performance")} className="spec-link">
                      Performance
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleLinkClick("armament")} className="spec-link">
                      Armament
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleLinkClick("avionics")} className="spec-link">
                      Avionics
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Display the content for the active section */}
          {isViewingSection && (
            <div className="spec-content">
              <button className="back-button" onClick={handleBackClick}>Back</button>
              <h3 className="spec-title">{activeSection}</h3>
              <div
                className="content-column"
                dangerouslySetInnerHTML={{ __html: getSectionContent() }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer Container */}
      <div className="footer-container">
        <div className="footer-warning">
          Government Use Only - Unauthorized Access is Prohibited.
        </div>
      </div>
    </div>
  );
}

export default App;