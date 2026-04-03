# 🚀 Lin-Kernighan & Heuristiques de Graphes (Visualizer)

Ce projet est un outil interactif développé avec **React** et **ReactFlow**. Il permet de modéliser un graphe pondéré par deux critères et d'optimiser le chemin de parcours en utilisant des méthodes heuristiques inspirées de l'algorithme de **Lin-Kernighan**.

---

## 🛠️ Fonctionnalités du Code

L'application transforme une saisie textuelle en un graphe dynamique et calcule un score d'optimisation basé sur une pondération multi-critères.

### 1. Modélisation Multi-critères
Le code utilise une formule de score combinée pour chaque arête afin de simplifier la prise de décision :
$$Score = 0.5 \times \text{Coût} + 0.5 \times \text{Temps}$$

### 2. Algorithmes d'Optimisation (Heuristiques)
À chaque clic sur **"Next Step"**, l'algorithme explore le voisinage du chemin actuel via trois méthodes :
* **2-opt** : Inverse des segments pour supprimer les croisements inefficaces.
* **3-opt (Node Removal)** : Tente de réduire le coût global en supprimant des étapes si cela améliore le score.
* **Or-opt** : Réinsère un nœud à une position différente pour tester de nouvelles combinaisons.

### 3. Interface de Visualisation
* **Placement Circulaire** : Les nœuds sont positionnés via $x = \cos(\theta)$ et $y = \sin(\theta)$ pour une lisibilité maximale.
* **Feedback Visuel** : Les arêtes du chemin optimal passent en rouge avec une animation de flux.

---

## 📊 Données de Test (Fictives)

Pour tester la puissance de l'algorithme, copiez et collez cette chaîne dans le champ de texte de l'application :

```text
A-B : (12;11) , A-C : (2;3) , A-D : (15;14) , B-C : (10;9) , B-E : (8;7) , C-D : (4;5) , C-E : (6;5) , C-F : (9;10) , D-E : (3;4) , D-F : (11;12) , E-F : (7;6) , E-G : (5;4) , F-G : (2;3) , F-H : (8;9) , G-H : (4;3)
