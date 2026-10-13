import { useState } from "react";
import { products } from "./products";
import "./App.css";

function ProductCard({ product }) {
    return (
        <div className="card">
            <span className="tag">{product.category}</span>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <strong>${product.price}</strong>
        </div>
    );
}

export default function App() {
    const [query, setQuery] = useState("");
    const [recommendedIds, setRecommendedIds] = useState(null); // null = show all
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const visibleProducts =
        recommendedIds === null
            ? products
            : products.filter((p) => recommendedIds.includes(p.id));

    async function handleSubmit(e) {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);

        setError("");

        try {
            const res = await fetch("/api/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Request failed");

            setRecommendedIds(data.ids);
            setReason(data.reason);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function showAll() {
        setRecommendedIds(null);
        setReason("");
        setQuery("");
        setError("");
    }

    return (
        <main className="container">
            <h1>AI Product Recommender System</h1>

            <form onSubmit={handleSubmit} className="search">

                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder='Try: "I want a phone under $500"'
                    maxLength={300}
                />
                <button disabled={loading}>{loading ? "Thinking..." : "Recommend"}</button>
                {recommendedIds !== null && (
                    <button type="button" className="secondary" onClick={showAll}>
                        Show all
                    </button>
                )}
            </form>

            {error && <p className="error">{error}</p>}
            {reason && <p className="reason">🤖 {reason}</p>}

            {visibleProducts.length === 0 ? (
                <p>No matching products found.</p>
            ) : (
                <div className="grid">
                    {visibleProducts.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            )}
        </main>
    );
}