import React, { useState, useCallback } from "react";
import ReactFlow, { Controls, Background, MiniMap } from "reactflow";
import "reactflow/dist/style.css";

// Composant principal de l'application Lin-Kernighan
export default function App() {
  // États pour gérer l'interface et les données
  const [edgeInput, setEdgeInput] = useState(""); // Texte saisi par l'utilisateur pour les arêtes
  const [edges, setEdges] = useState([]); // Arêtes pour React Flow (visualisation)
  const [nodes, setNodes] = useState([]); // Nœuds pour React Flow
  const [path, setPath] = useState([]); // Chemin actuel (liste d'IDs de nœuds)
  const [step, setStep] = useState(0); // Étape actuelle de l'optimisation
  const [graph, setGraph] = useState([]); // Liste des arêtes avec leurs données (from, to, criteria, score)
  const [nodeNameToId, setNodeNameToId] = useState({}); // Map pour convertir nom de nœud en ID numérique

  // Fonction pour parser le texte saisi et créer le graphe
  const parseEdges = () => {
    // Regex pour extraire les arêtes au format "A-B : (val1;val2;...)"
    const edgeRegex = /(\w)-(\w)\s*:\s*\(([^)]+)\)/g;
    const edgesList = [];
    const nodes = new Set(); // Ensemble des nœuds uniques
    let match;
    let numCriteria = 0; // Nombre de critères détecté

    // Parcourir toutes les arêtes dans le texte
    while ((match = edgeRegex.exec(edgeInput)) !== null) {
      const from = match[1]; // Nœud de départ
      const to = match[2]; // Nœud d'arrivée
      const criteriaStr = match[3]; // Chaîne des critères
      const criteria = criteriaStr.split(';').map(s => parseFloat(s.trim())); // Convertir en nombres
      
      // Vérifier la cohérence du nombre de critères
      if (numCriteria === 0) numCriteria = criteria.length;
      else if (criteria.length !== numCriteria) {
        alert(`Nombre de critères incohérent. Toutes les arêtes doivent avoir ${numCriteria} critères.`);
        return;
      }

      // Calculer le score comme moyenne des critères (pondération égale)
      const score = criteria.reduce((sum, val) => sum + val, 0) / numCriteria;
      
      edgesList.push({ from, to, criteria, score });
      nodes.add(from);
      nodes.add(to);
    }

    // Vérifier qu'au moins une arête a été trouvée
    if (edgesList.length === 0) {
      alert("Format invalide. Exemple: A-B : (3;5) , A-C : (4;4;2)");
      return;
    }

    // Créer les nœuds et arêtes pour React Flow
    const nodeArray = Array.from(nodes).sort(); // Trier les nœuds
    const nameToId = {};
    const rfNodes = nodeArray.map((name, idx) => {
      nameToId[name] = idx; // Map nom -> ID
      return {
        id: idx.toString(),
        data: { label: name },
        position: {
          x: 150 * Math.cos((idx / nodeArray.length) * 2 * Math.PI), // Position en cercle
          y: 150 * Math.sin((idx / nodeArray.length) * 2 * Math.PI),
        },
      };
    });

    // Créer les arêtes React Flow
    const rfEdges = edgesList.map((e, idx) => ({
      id: idx.toString(),
      source: nameToId[e.from].toString(),
      target: nameToId[e.to].toString(),
      label: e.criteria.join(';'), // Label avec les critères
      animated: false,
    }));

    // Mettre à jour les états
    setNodes(rfNodes);
    setNodeNameToId(nameToId);
    setEdges(rfEdges);
    setGraph(edgesList);

    // Initialiser le chemin avec tous les nœuds
    const initialPath = nodeArray.map((name) => nameToId[name]);
    setPath(initialPath);
    setStep(0);
  };

  // Fonction pour calculer le score total d'un chemin
  const computeScore = (p, edgeList) => {
    let total = 0;
    for (let i = 0; i < p.length - 1; i++) {
      // Trouver l'arête entre p[i] et p[i+1]
      const edge = edgeList.find(e => e.from === p[i] && e.to === p[i + 1]);
      if (edge) total += edge.score; // Ajouter le score de l'arête
      else total += 1000; // Pénalité si l'arête n'existe pas
    }
    return total;
  };

  // Fonction pour effectuer une étape d'optimisation Lin-Kernighan
  const nextStep = () => {
    if (graph.length === 0) return; // Rien à faire si pas de graphe

    // Convertir les IDs des nœuds en noms pour faciliter les manipulations
    const nodeIdToName = Object.fromEntries(
      Object.entries(nodeNameToId).map(([name, id]) => [id, name])
    );
    const pathNames = path.map(id => nodeIdToName[id]);

    let bestPath = [...pathNames]; // Meilleur chemin trouvé
    let bestScore = computeScore(pathNames, graph); // Score actuel

    // 2-opt : tester les inversions de segments
    for (let i = 1; i < pathNames.length - 1; i++) {
      for (let j = i + 1; j < pathNames.length; j++) {
        let newPath = [...pathNames];
        const segment = newPath.slice(i, j).reverse(); // Inverser le segment
        newPath.splice(i, j - i, ...segment);

        const newScore = computeScore(newPath, graph);
        if (newScore < bestScore) { // Si amélioration
          bestScore = newScore;
          bestPath = newPath;
        }
      }
    }

    // 3-opt : tester la suppression d'un nœud (pour réduire le chemin)
    for (let i = 1; i < pathNames.length - 1; i++) {
      let newPath = [...pathNames];
      newPath.splice(i, 1); // Supprimer le nœud à la position i

      const newScore = computeScore(newPath, graph);
      if (newScore < bestScore) {
        bestScore = newScore;
        bestPath = newPath;
      }
    }

    // 3-opt : Or-opt (déplacer un nœud à une autre position)
    for (let i = 1; i < pathNames.length - 1; i++) {
      for (let j = 1; j < pathNames.length; j++) {
        if (i === j || i + 1 === j) continue; // Éviter les déplacements inutiles
        let newPath = [...pathNames];
        const node = newPath.splice(i, 1)[0]; // Extraire le nœud
        newPath.splice(j > i ? j - 1 : j, 0, node); // Le replacer ailleurs

        const newScore = computeScore(newPath, graph);
        if (newScore < bestScore) {
          bestScore = newScore;
          bestPath = newPath;
        }
      }
    }

    // Mettre à jour le chemin et l'étape
    const bestPathIds = bestPath.map(name => nodeNameToId[name]);
    setPath(bestPathIds);
    setStep(step + 1);

    // Mettre en évidence le chemin optimal dans la visualisation
    const highlightedEdges = edges.map((e, idx) => {
      let isInPath = false;
      // Vérifier si cette arête fait partie du meilleur chemin
      for (let i = 0; i < bestPath.length - 1; i++) {
        const sourceName = Object.keys(nodeNameToId).find(k => nodeNameToId[k] === parseInt(e.source));
        const targetName = Object.keys(nodeNameToId).find(k => nodeNameToId[k] === parseInt(e.target));
        if (bestPath[i] === sourceName && bestPath[i + 1] === targetName) {
          isInPath = true;
          break;
        }
      }
      return {
        ...e,
        animated: isInPath, // Animer si dans le chemin
        style: isInPath ? { stroke: "#ff0000", strokeWidth: 3 } : {}, // Rouge et épais
      };
    });
    setEdges(highlightedEdges);
  };

  // Préparer l'affichage du chemin actuel
  const nodeIdToName = Object.fromEntries(
    Object.entries(nodeNameToId).map(([name, id]) => [id, name])
  );
  const pathDisplay = path.map(id => nodeIdToName[id] || "?").join(" → ");

  // Interface utilisateur
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Panneau gauche : contrôles et informations */}
      <div style={{ width: "30%", padding: "20px", overflowY: "auto", borderRight: "1px solid #ccc" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Lin-Kernighan</h1>

        {/* Saisie des arêtes */}
        <div style={{ marginTop: "20px" }}>
          <label>Arêtes (format: A-B : (3;5) ou A-B : (3;5;2) pour plus de critères)</label>
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
