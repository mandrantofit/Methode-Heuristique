🚀 Lin-Kernighan & Heuristiques de Graphes (Visualizer)

Ce projet est un outil interactif développé avec React et ReactFlow. Il permet de modéliser un graphe pondéré par deux critères et d'optimiser le chemin de parcours en utilisant des méthodes heuristiques inspirées de l'algorithme de Lin-Kernighan (2-opt, 3-opt, et Or-opt).
🛠️ Fonctionnalités du Code

L'application transforme une saisie textuelle en un graphe dynamique et calcule un score d'optimisation basé sur une pondération multi-critères.
1. Modélisation Multi-critères

Le code utilise une formule de score combinée pour chaque arête :
Score=0.5×Couˆt+0.5×Temps

Cela permet de transformer un problème complexe à deux variables en un problème de recherche de chemin simple.
2. Algorithmes d'Optimisation (Heuristiques)

À chaque clic sur "Next Step", l'algorithme parcourt les voisinages du chemin actuel pour trouver une amélioration :

    2-opt : Inverse des segments du chemin pour éliminer les croisements.

    3-opt (Node Removal) : Tente de simplifier le parcours en retirant des étapes inutiles.

    Or-opt : Déplace un nœud à une autre position dans la séquence pour réduire le score total.

3. Visualisation Dynamique

    ReactFlow : Affiche les nœuds sur un cercle trigonométrique pour une clarté maximale.

    Animation : Le chemin optimal calculé est mis en évidence par des arêtes rouges animées.

📊 Données de Test (Fictives)

Pour tester l'algorithme, vous pouvez copier-coller la chaîne suivante dans la zone de saisie de l'application :
Plaintext

A-B : (12;11) , A-C : (2;3) , A-D : (15;14) , B-C : (10;9) , B-E : (8;7) , C-D : (4;5) , C-E : (6;5) , C-F : (9;10) , D-E : (3;4) , D-F : (11;12) , E-F : (7;6) , E-G : (5;4) , F-G : (2;3) , F-H : (8;9) , G-H : (4;3)

🚀 Installation et Lancement

Le projet a été initialisé avec Create React App.
1. Installation des dépendances
Bash

npm install reactflow

2. Démarrage
Bash

npm start

L'application sera disponible sur http://localhost:3000.
3. Build pour la production
Bash

npm run build

📖 En savoir plus

Ce projet a été réalisé dans le cadre de l'étude des Méthodes Heuristiques. Il illustre comment des transformations locales (échanges d'arêtes) permettent d'approcher une solution optimale pour des problèmes de type Voyageur de Commerce (TSP) ou optimisation de réseaux.
