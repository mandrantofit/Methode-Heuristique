import React, { useState, useCallback } from "react";
import ReactFlow, { Controls, Background, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

export default function App() {
  const [edgeInput, setEdgeInput] = useState("");
  const [edges, setEdges] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [path, setPath] = useState([]);
  const [step, setStep] = useState(0);
  const [graph, setGraph] = useState([]);
  const [nodeNameToId, setNodeNameToId] = useState({});

  const parseEdges = () => {
    // Format: "A-B : (12;11;10) , C-D : (2;3;4) , ..."
    const edgeRegex = /(\w)-(\w)\s*:\s*\(([^)]+)\)/g;
    const edgesList = [];
    const nodes = new Set();
    let match;
    let numCriteria = 0;

    while ((match = edgeRegex.exec(edgeInput)) !== null) {
      const from = match[1];
      const to = match[2];
      const criteriaStr = match[3];
      const criteria = criteriaStr.split(';').map(s => parseFloat(s.trim()));
      
      if (numCriteria === 0) numCriteria = criteria.length;
      else if (criteria.length !== numCriteria) {
        alert(`Nombre de critères incohérent. Toutes les arêtes doivent avoir ${numCriteria} critères.`);
        return;
      }

      const score = criteria.reduce((sum, val) => sum + val, 0) / numCriteria; // Pondération égale
      
      edgesList.push({ from, to, criteria, score });
      nodes.add(from);
      nodes.add(to);
    }

    if (edgesList.length === 0) {
      alert("Format invalide. Exemple: A-B : (3;5) , A-C : (4;4;2)");
      return;
    }

    // Créer la map node -> id et les nœuds react-flow
    const nodeArray = Array.from(nodes).sort();
    const nameToId = {};
    const rfNodes = nodeArray.map((name, idx) => {
      nameToId[name] = idx;
      return {
        id: idx.toString(),
        data: { label: name },
        position: {
          x: 150 * Math.cos((idx / nodeArray.length) * 2 * Math.PI),
          y: 150 * Math.sin((idx / nodeArray.length) * 2 * Math.PI),
        },
      };
    });

    // Créer les arêtes react-flow
    const rfEdges = edgesList.map((e, idx) => ({
      id: idx.toString(),
      source: nameToId[e.from].toString(),
      target: nameToId[e.to].toString(),
      label: e.criteria.join(';'),
      animated: false,
    }));

    setNodes(rfNodes);
    setNodeNameToId(nameToId);
    setEdges(rfEdges);
    setGraph(edgesList);

    // Initialiser le chemin avec tous les nœuds
    const initialPath = nodeArray.map((name) => nameToId[name]);
    setPath(initialPath);
    setStep(0);
  };

  const computeScore = (p, edgeList) => {
    let total = 0;
    for (let i = 0; i < p.length - 1; i++) {
      const edge = edgeList.find(e => e.from === p[i] && e.to === p[i + 1]);
      if (edge) total += edge.score;
      else total += 1000;
    }
    return total;
  };

  const nextStep = () => {
    if (graph.length === 0) return;

    // Convertir les IDs en noms
    const nodeIdToName = Object.fromEntries(
      Object.entries(nodeNameToId).map(([name, id]) => [id, name])
    );
    const pathNames = path.map(id => nodeIdToName[id]);

    let bestPath = [...pathNames];
    let bestScore = computeScore(pathNames, graph);

    // 2-opt : inversion de segments
    for (let i = 1; i < pathNames.length - 1; i++) {
      for (let j = i + 1; j < pathNames.length; j++) {
        let newPath = [...pathNames];
        const segment = newPath.slice(i, j).reverse();
        newPath.splice(i, j - i, ...segment);

        const newScore = computeScore(newPath, graph);
        if (newScore < bestScore) {
          bestScore = newScore;
          bestPath = newPath;
        }
      }
    }

    // 3-opt : supprimer un nœud
    for (let i = 1; i < pathNames.length - 1; i++) {
      let newPath = [...pathNames];
      newPath.splice(i, 1); // Retirer le nœud à l'index i

      const newScore = computeScore(newPath, graph);
      if (newScore < bestScore) {
        bestScore = newScore;
        bestPath = newPath;
      }
    }

    // 3-opt : Or-opt (déplacer un segment)
    for (let i = 1; i < pathNames.length - 1; i++) {
      for (let j = 1; j < pathNames.length; j++) {
        if (i === j || i + 1 === j) continue;
        let newPath = [...pathNames];
        const node = newPath.splice(i, 1)[0];
        newPath.splice(j > i ? j - 1 : j, 0, node);

        const newScore = computeScore(newPath, graph);
        if (newScore < bestScore) {
          bestScore = newScore;
          bestPath = newPath;
        }
      }
    }

    // Convertir les noms en IDs
    const bestPathIds = bestPath.map(name => nodeNameToId[name]);
    setPath(bestPathIds);
    setStep(step + 1);

    // Mettre en évidence le chemin dans le graphe
    const highlightedEdges = edges.map((e, idx) => {
      let isInPath = false;
      for (let i = 0; i < bestPath.length - 1; i++) {
        if (bestPath[i] === Object.keys(nodeNameToId).find(k => nodeNameToId[k] === parseInt(e.source)) &&
            bestPath[i + 1] === Object.keys(nodeNameToId).find(k => nodeNameToId[k] === parseInt(e.target))) {
          isInPath = true;
          break;
        }
      }
      return {
        ...e,
        animated: isInPath,
        style: isInPath ? { stroke: "#ff0000", strokeWidth: 3 } : {},
      };
    });
    setEdges(highlightedEdges);
  };

  const nodeIdToName = Object.fromEntries(
    Object.entries(nodeNameToId).map(([name, id]) => [id, name])
  );
  const pathDisplay = path.map(id => nodeIdToName[id] || "?").join(" → ");

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: "30%", padding: "20px", overflowY: "auto", borderRight: "1px solid #ccc" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Lin-Kernighan</h1>

        <div style={{ marginTop: "20px" }}>
          <label>Arêtes (format: A-B : (3;5) , A-B : (3;5;2) , A-B : (3;5;2;4) pour plus de critères)</label>
          <textarea
            value={edgeInput}
            onChange={(e) => setEdgeInput(e.target.value)}
            style={{
              width: "100%",
              height: "100px",
              padding: "8px",
              border: "1px solid #ccc",
              marginTop: "8px",
              fontFamily: "monospace",
            }}
            placeholder="A-B : (3;5) , A-C : (4;4;2) , B-C : (2;3;1)"
          />
        </div>

        <button
          onClick={parseEdges}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Charger Graphe
        </button>

        {graph.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h3>Détails des arêtes</h3>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
              border: "1px solid #ccc"
            }}>
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th style={{ border: "1px solid #ccc", padding: "6px" }}>De → Vers</th>
                  {graph[0]?.criteria.map((_, idx) => (
                    <th key={idx} style={{ border: "1px solid #ccc", padding: "6px" }}>
                      Critère #{idx + 1}
                    </th>
                  ))}
                  <th style={{ border: "1px solid #ccc", padding: "6px" }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {graph.map((edge, idx) => (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #ccc", padding: "6px" }}>
                      {edge.from} → {edge.to}
                    </td>
                    {edge.criteria.map((crit, critIdx) => (
                      <td key={critIdx} style={{ border: "1px solid #ccc", padding: "6px", textAlign: "center" }}>
                        {crit.toFixed(1)}
                      </td>
                    ))}
                    <td style={{ border: "1px solid #ccc", padding: "6px", textAlign: "center", fontWeight: "bold" }}>
                      {edge.score.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: "30px" }}>
          <h3>Chemin actuel :</h3>
          <p style={{ fontFamily: "monospace", fontSize: "14px" }}>{pathDisplay}</p>
          
          {graph.length > 0 && (
            <>
              <p>
                Score:{" "}
                {computeScore(path.map(id => nodeIdToName[id]), graph).toFixed(2)}
              </p>
              <p>Étape: {step}</p>
            </>
          )}
        </div>

        <button
          onClick={nextStep}
          disabled={graph.length === 0}
          style={{
            marginTop: "20px",
            padding: "8px 16px",
            backgroundColor: graph.length === 0 ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: graph.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          Next Step
        </button>
      </div>

      <div style={{ width: "70%" }}>
        <ReactFlow nodes={nodes} edges={edges}>
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
