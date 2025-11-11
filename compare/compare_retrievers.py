import csv
import numpy as np
from data import docs, eval_qs
from rank_bm25 import BM25Okapi
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer, util

tokenized = [doc.split() for doc in docs]
bm25 = BM25Okapi(tokenized)

def bm25_topk(query, k=5):
    scores = bm25.get_scores(query.split())
    top_idx = np.argsort(scores)[::-1][:k]
    return [int(i) for i in top_idx], [float(scores[int(i)]) for i in top_idx]

tfidf_vectorizer = TfidfVectorizer()
tfidf_matrix = tfidf_vectorizer.fit_transform(docs)

def tfidf_topk(query, k=5):
    q_vec = tfidf_vectorizer.transform([query])
    sims = cosine_similarity(q_vec, tfidf_matrix)[0]
    top_idx = np.argsort(sims)[::-1][:k]
    return [int(i) for i in top_idx], [float(sims[int(i)]) for i in top_idx]

EMBED_MODELS = {
    "all-MiniLM-L6-v2": SentenceTransformer("all-MiniLM-L6-v2"),
    "multi-qa-MiniLM-L6-dot-v1": SentenceTransformer("multi-qa-MiniLM-L6-dot-v1")
}

doc_embs_by_model = {}
for name, m in EMBED_MODELS.items():
    doc_embs_by_model[name] = m.encode(docs, convert_to_tensor=True)

def embed_topk_for_model(model_name, query, k=5):
    model = EMBED_MODELS[model_name]
    doc_embs = doc_embs_by_model[model_name]
    q_emb = model.encode(query, convert_to_tensor=True)
    hits = util.semantic_search(q_emb, doc_embs, top_k=k)[0]
    idxs = [int(h['corpus_id']) for h in hits]
    scores = [float(h.get('score', 0.0)) for h in hits]
    return idxs, scores

def compute_metrics_for_retriever(retriever_fn):
    p1 = 0
    rr_sum = 0.0
    for item in eval_qs:
        q = item["q"]; gold = item["gold_idx"]
        idxs, _ = retriever_fn(q)
        if len(idxs) > 0 and idxs[0] == gold:
            p1 += 1
        rr = 0.0
        for rank, idx in enumerate(idxs, start=1):
            if idx == gold:
                rr = 1.0 / rank
                break
        rr_sum += rr
    n = len(eval_qs)
    return {"P@1": round(p1 / n, 3), "MRR": round(rr_sum / n, 3)}

results = []
bm25_metrics = compute_metrics_for_retriever(lambda q: bm25_topk(q, k=5))
results.append({"method": "BM25", "model": "", **bm25_metrics})
tfidf_metrics = compute_metrics_for_retriever(lambda q: tfidf_topk(q, k=5))
results.append({"method": "TF-IDF", "model": "", **tfidf_metrics})
for model_name in EMBED_MODELS.keys():
    metrics = compute_metrics_for_retriever(lambda q, mn=model_name: embed_topk_for_model(mn, q, k=5))
    results.append({"method": "Embeddings", "model": model_name, **metrics})

print("\n=== Retrieval Comparison Summary ===")
print(f"{'Method':<12}{'Model':<30}{'P@1':<8}{'MRR':<8}")
for r in results:
    method = r["method"]; model = r["model"] or "-"
    print(f"{method:<12}{model:<30}{r['P@1']:<8}{r['MRR']:<8}")

summary_csv = "results.csv"
with open(summary_csv, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["method", "model", "P@1", "MRR"])
    w.writeheader()
    for r in results:
        w.writerow({"method": r["method"], "model": r["model"], "P@1": r["P@1"], "MRR": r["MRR"]})

print(f"\nWrote summary metrics to: {summary_csv}")

per_query_csv = "per_query_results.csv"
with open(per_query_csv, "w", newline="", encoding="utf-8") as f:
    fieldnames = ["query", "gold_idx", "method", "model", "topk_idxs", "topk_scores", "is_top1_correct"]
    w = csv.DictWriter(f, fieldnames=fieldnames)
    w.writeheader()
    for item in eval_qs:
        q = item["q"]; gold = item["gold_idx"]
        idxs, scores = bm25_topk(q, k=3)
        w.writerow({
            "query": q, "gold_idx": gold, "method": "BM25", "model": "",
            "topk_idxs": ",".join(map(str, idxs)),
            "topk_scores": ",".join(map(str, scores)),
            "is_top1_correct": int(idxs[0] == gold) if idxs else 0
        })
        idxs, scores = tfidf_topk(q, k=3)
        w.writerow({
            "query": q, "gold_idx": gold, "method": "TF-IDF", "model": "",
            "topk_idxs": ",".join(map(str, idxs)),
            "topk_scores": ",".join(map(str, scores)),
            "is_top1_correct": int(idxs[0] == gold) if idxs else 0
        })
        for model_name in EMBED_MODELS.keys():
            idxs, scores = embed_topk_for_model(model_name, q, k=3)
            w.writerow({
                "query": q, "gold_idx": gold, "method": "Embeddings", "model": model_name,
                "topk_idxs": ",".join(map(str, idxs)),
                "topk_scores": ",".join(map(str, scores)),
                "is_top1_correct": int(idxs[0] == gold) if idxs else 0
            })

print(f"Wrote per-query results to: {per_query_csv}")

print("\n--- Example query top-1s (qualitative) ---")
for item in eval_qs:
    q = item["q"]
    bm25_idx, _ = bm25_topk(q, k=1)
    tfidf_idx, _ = tfidf_topk(q, k=1)
    emb1_idx, _ = embed_topk_for_model(list(EMBED_MODELS.keys())[0], q, k=1)
    emb2_idx, _ = embed_topk_for_model(list(EMBED_MODELS.keys())[1], q, k=1)
    print(f"\nQuery: {q}")
    print(f"  BM25   -> [{bm25_idx[0]}] {docs[bm25_idx[0]][:140]}")
    print(f"  TF-IDF -> [{tfidf_idx[0]}] {docs[tfidf_idx[0]][:140]}")
    print(f"  {list(EMBED_MODELS.keys())[0]} -> [{emb1_idx[0]}] {docs[emb1_idx[0]][:140]}")
    print(f"  {list(EMBED_MODELS.keys())[1]} -> [{emb2_idx[0]}] {docs[emb2_idx[0]][:140]}")

print("\nDone.")
