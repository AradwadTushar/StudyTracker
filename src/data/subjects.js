export const SUBJECTS = [
  'C Programming','Data Structures','Algorithms',
  'OS','DBMS','Computer Networks','COA','Discrete Maths','Aptitude / Quant',
];

// New model: topics have subtopics array
export const SYLLABUS = {
  'C Programming': [
    { id:'c1', topic:'Basics: Variables, Data Types, Operators', subtopics:['int/float/char/double','Type casting','Arithmetic & Bitwise operators','Operator precedence'] },
    { id:'c2', topic:'Control Flow', subtopics:['if/else/switch','for/while/do-while','break/continue/goto'] },
    { id:'c3', topic:'Functions & Recursion', subtopics:['Call by value vs reference','Stack frames','Tail recursion','Memoization basics'] },
    { id:'c4', topic:'Arrays & Strings', subtopics:['1D/2D arrays','String functions: strlen, strcpy, strcat','Character arrays vs string literals'] },
    { id:'c5', topic:'Pointers & Memory', subtopics:['Pointer arithmetic','Double pointers','Pointer to function','void pointer','NULL pointer'] },
    { id:'c6', topic:'Structures & Unions', subtopics:['struct vs union','Nested structs','Bit fields','typedef'] },
    { id:'c7', topic:'Dynamic Memory Allocation', subtopics:['malloc/calloc/realloc/free','Memory leaks','Dangling pointers'] },
    { id:'c8', topic:'File I/O', subtopics:['fopen/fclose','fread/fwrite','fprintf/fscanf','Binary vs text mode'] },
    { id:'c9', topic:'Preprocessor & Macros', subtopics:['#define/#include/#ifdef','Macro functions','Header guards'] },
    { id:'c10', topic:'Bit Manipulation', subtopics:['AND/OR/XOR/NOT','Left/right shift','Setting/clearing bits','Two\'s complement'] },
  ],
  'Data Structures': [
    { id:'ds1', topic:'Arrays & Linked Lists', subtopics:['Singly/Doubly/Circular LL','Array vs LL tradeoffs','XOR linked list'] },
    { id:'ds2', topic:'Stacks & Queues', subtopics:['Array/LL implementation','Infix to Postfix','Circular queue','Deque','Priority Queue'] },
    { id:'ds3', topic:'Trees', subtopics:['Binary Tree traversals','BST operations','AVL rotations','Red-Black Tree','Segment Tree','Fenwick Tree'] },
    { id:'ds4', topic:'Heaps', subtopics:['Min/Max heap','Heapify','Heap sort','k-th largest element'] },
    { id:'ds5', topic:'Hashing', subtopics:['Hash functions','Collision resolution: chaining, open addressing','Load factor','Double hashing'] },
    { id:'ds6', topic:'Graphs', subtopics:['Adjacency matrix/list','BFS/DFS','Topological sort','Strongly connected components'] },
    { id:'ds7', topic:'Advanced Structures', subtopics:['Trie','Suffix array','Disjoint Set Union (DSU)','Sparse Table'] },
  ],
  'Algorithms': [
    { id:'al1', topic:'Sorting', subtopics:['Bubble/Selection/Insertion','Merge Sort','Quick Sort (partitions)','Heap Sort','Counting/Radix/Bucket Sort','Stability'] },
    { id:'al2', topic:'Searching', subtopics:['Binary Search','Ternary Search','Binary search on answer'] },
    { id:'al3', topic:'Divide & Conquer', subtopics:['Master theorem','Strassen matrix multiply','Closest pair of points'] },
    { id:'al4', topic:'Greedy', subtopics:['Activity selection','Huffman coding','Fractional knapsack','Job scheduling'] },
    { id:'al5', topic:'Dynamic Programming', subtopics:['0/1 Knapsack','LCS/LIS','Matrix chain multiplication','DP on trees','Bitmask DP'] },
    { id:'al6', topic:'Graph Algorithms', subtopics:['Dijkstra','Bellman-Ford','Floyd-Warshall','Prim\'s','Kruskal\'s','Bridges & Articulation points'] },
    { id:'al7', topic:'Complexity Analysis', subtopics:['Big-O/Theta/Omega','Recurrence relations','Amortized analysis','NP-completeness basics'] },
    { id:'al8', topic:'Backtracking', subtopics:['N-Queens','Sudoku solver','Subset sum','Graph coloring'] },
  ],
  'OS': [
    { id:'os1', topic:'Process Management & PCB', subtopics:['Process states','PCB structure','Threads vs Processes','Context switching','fork() system call'] },
    { id:'os2', topic:'CPU Scheduling', subtopics:['FCFS','SJF/SRTF','Round Robin','Priority scheduling','Multilevel queue','Gantt charts'] },
    { id:'os3', topic:'Synchronization', subtopics:['Race condition','Critical section','Mutex','Semaphores','Monitor','Classic problems: Producer-Consumer, Reader-Writer, Dining Philosophers'] },
    { id:'os4', topic:'Deadlock', subtopics:['Coffman conditions','Resource allocation graph','Banker\'s algorithm','Detection & Recovery'] },
    { id:'os5', topic:'Memory Management', subtopics:['Contiguous allocation','Fragmentation','Paging','Segmentation','Page table structure'] },
    { id:'os6', topic:'Virtual Memory', subtopics:['Demand paging','Page fault','Page replacement: FIFO, LRU, Optimal','Thrashing','Working set model'] },
    { id:'os7', topic:'File Systems', subtopics:['File allocation: contiguous/linked/indexed','Inodes','FAT','Directory structure'] },
    { id:'os8', topic:'I/O Systems', subtopics:['Disk scheduling: FCFS, SSTF, SCAN, C-SCAN','RAID levels','Spooling','Buffering'] },
  ],
  'DBMS': [
    { id:'db1', topic:'ER Model', subtopics:['Entities & attributes','Relationships & cardinality','Weak entities','ER to relational mapping'] },
    { id:'db2', topic:'Relational Algebra', subtopics:['Select/Project/Join','Union/Intersection/Difference','Division','Rename'] },
    { id:'db3', topic:'SQL', subtopics:['DDL: CREATE/ALTER/DROP','DML: INSERT/UPDATE/DELETE','Joins: inner/outer/cross','Subqueries','Aggregates: GROUP BY/HAVING','Views & indexes'] },
    { id:'db4', topic:'Normalization', subtopics:['Functional dependencies','1NF/2NF/3NF/BCNF','Lossless decomposition','Dependency preservation'] },
    { id:'db5', topic:'Transactions & ACID', subtopics:['Atomicity/Consistency/Isolation/Durability','Schedule types','Serializability','Conflict & view serializability'] },
    { id:'db6', topic:'Concurrency Control', subtopics:['Lock-based: 2PL','Timestamp ordering','Optimistic CC','Deadlock in DBMS'] },
    { id:'db7', topic:'Indexing', subtopics:['B-Tree vs B+ Tree','Dense vs sparse index','Clustered vs unclustered','Hash indexing'] },
  ],
  'Computer Networks': [
    { id:'cn1', topic:'OSI & TCP/IP Model', subtopics:['7 OSI layers with functions','TCP/IP 5-layer','PDUs at each layer','Encapsulation'] },
    { id:'cn2', topic:'Data Link Layer', subtopics:['Framing','Error detection: CRC, Hamming','Flow control: Stop-and-wait, Go-Back-N, Selective Repeat','MAC addresses'] },
    { id:'cn3', topic:'MAC & Ethernet', subtopics:['CSMA/CD','CSMA/CA','802.11 WiFi','Token ring','VLAN'] },
    { id:'cn4', topic:'Network Layer', subtopics:['IPv4/IPv6','Subnetting & CIDR','Routing: RIP, OSPF, BGP','NAT','ICMP','ARP'] },
    { id:'cn5', topic:'Transport Layer', subtopics:['TCP vs UDP','3-way handshake','Congestion control: slow start, AIMD','Flow control','Port numbers'] },
    { id:'cn6', topic:'Application Layer', subtopics:['HTTP/HTTPS','DNS resolution','SMTP/POP3/IMAP','FTP','DHCP','Socket programming basics'] },
    { id:'cn7', topic:'Network Security', subtopics:['Symmetric vs asymmetric encryption','SSL/TLS','Firewalls','VPN','Common attacks: DoS, MITM'] },
  ],
  'COA': [
    { id:'coa1', topic:'Number Systems', subtopics:['Binary/Octal/Hex conversions','BCD','IEEE 754 floating point','Signed representation: 1s/2s complement'] },
    { id:'coa2', topic:'Boolean Algebra & Logic Gates', subtopics:['De Morgan\'s laws','SOP/POS forms','K-map simplification','NAND/NOR universality'] },
    { id:'coa3', topic:'Combinational Circuits', subtopics:['Adder/Subtractor','Multiplexer/Demux','Encoder/Decoder','Comparator'] },
    { id:'coa4', topic:'Sequential Circuits', subtopics:['Latches vs Flip-flops','SR/JK/D/T flip-flops','Registers','Counters (synchronous/asynchronous)'] },
    { id:'coa5', topic:'ISA & CPU Design', subtopics:['RISC vs CISC','Instruction formats','Addressing modes','ALU design','Control unit: hardwired vs microprogrammed'] },
    { id:'coa6', topic:'Pipelining', subtopics:['Pipeline stages','Hazards: structural/data/control','Forwarding','Branch prediction','Speedup calculation'] },
    { id:'coa7', topic:'Memory Hierarchy', subtopics:['Cache: direct/associative/set-associative','Cache replacement policies','Write policies','Virtual memory','TLB'] },
    { id:'coa8', topic:'I/O Organization', subtopics:['Programmed I/O','Interrupt-driven I/O','DMA','I/O buses','Memory-mapped I/O'] },
  ],
  'Discrete Maths': [
    { id:'dm1', topic:'Propositional Logic', subtopics:['Connectives: AND/OR/NOT/XOR','Implication & biconditional','Truth tables','Tautology/contradiction','CNF/DNF'] },
    { id:'dm2', topic:'Predicate Logic', subtopics:['Universal & existential quantifiers','Nested quantifiers','Inference rules','Proof techniques'] },
    { id:'dm3', topic:'Set Theory', subtopics:['Set operations','Power set','Cartesian product','Venn diagrams','Inclusion-exclusion'] },
    { id:'dm4', topic:'Relations & Functions', subtopics:['Reflexive/Symmetric/Transitive','Equivalence relations','Partial orders','Bijection/injection/surjection','Composition'] },
    { id:'dm5', topic:'Graph Theory', subtopics:['Types of graphs','Degree sequence','Euler/Hamiltonian paths','Planarity','Graph coloring','Trees'] },
    { id:'dm6', topic:'Combinatorics', subtopics:['Permutations & combinations','Pigeonhole principle','Binomial theorem','Generating functions'] },
    { id:'dm7', topic:'Probability', subtopics:['Sample space & events','Conditional probability','Bayes theorem','Random variables','Distributions: Binomial, Poisson'] },
    { id:'dm8', topic:'Recurrence Relations', subtopics:['Homogeneous recurrences','Master theorem','Solving with characteristic roots'] },
  ],
  'Aptitude / Quant': [
    { id:'ap1', topic:'Number Theory', subtopics:['LCM/GCD','Divisibility rules','Prime factorization','Modular arithmetic','Remainder theorem'] },
    { id:'ap2', topic:'Algebra', subtopics:['Linear equations','Quadratic equations','Progressions: AP/GP','Inequalities'] },
    { id:'ap3', topic:'Arithmetic', subtopics:['Percentage','Profit & Loss','Simple & Compound Interest','Ratio & Proportion'] },
    { id:'ap4', topic:'Time, Speed, Distance', subtopics:['Relative speed','Trains','Boats & streams','Circular tracks'] },
    { id:'ap5', topic:'Permutation & Combination', subtopics:['nPr/nCr','Circular permutation','Distribution problems'] },
    { id:'ap6', topic:'Data Interpretation', subtopics:['Bar/Line/Pie charts','Tables','Caselets'] },
    { id:'ap7', topic:'Logical Reasoning', subtopics:['Syllogisms','Blood relations','Directions','Coding-decoding','Series'] },
  ],
};

export const STICKY_COLORS = ['#FFE066','#FF8FAB','#72EFDD','#C77DFF','#FFB347','#74B9FF'];
export const PRIORITY_COLORS = { high:'#FF5C6C', medium:'#F5A623', low:'#2DD4A0' };
export const GOAL_COLORS = ['#6C63FF','#2DD4A0','#FF5C6C','#F5A623','#3B9EFF','#FF8FAB','#C77DFF'];

// ── GATE CS Official Syllabus (from IIT Guwahati GATE 2026) ──────────────────
export const GATE_SYLLABUS_TOPICS = {
  'Discrete Maths': [
    { topic: 'Propositional & First Order Logic', subtopics: ['Propositions', 'Predicates', 'Quantifiers', 'Inference rules'] },
    { topic: 'Sets, Relations & Functions', subtopics: ['Set operations', 'Partial orders', 'Lattices', 'Monoids', 'Groups'] },
    { topic: 'Graph Theory', subtopics: ['Connectivity', 'Matching', 'Colouring', 'Planarity'] },
    { topic: 'Combinatorics', subtopics: ['Counting', 'Recurrence relations', 'Generating functions'] },
    { topic: 'Linear Algebra', subtopics: ['Matrices', 'Determinants', 'Eigenvalues & eigenvectors', 'LU decomposition'] },
    { topic: 'Calculus', subtopics: ['Limits & continuity', 'Maxima & minima', 'Mean value theorem', 'Integration'] },
    { topic: 'Probability & Statistics', subtopics: ['Random variables', 'Distributions: Normal/Poisson/Binomial', 'Mean/Median/Mode', 'Bayes theorem'] },
  ],
  'COA': [
    { topic: 'Digital Logic', subtopics: ['Boolean algebra', 'Combinational circuits', 'Sequential circuits', 'Minimization', 'Number representations'] },
    { topic: 'Machine Instructions & Addressing', subtopics: ['Instruction formats', 'Addressing modes', 'ALU design', 'Datapath & control unit'] },
    { topic: 'Instruction Pipelining', subtopics: ['Pipeline stages', 'Structural hazards', 'Data hazards', 'Control hazards'] },
    { topic: 'Memory Hierarchy', subtopics: ['Cache memory', 'Main memory', 'Secondary storage', 'I/O interface', 'DMA & interrupts'] },
  ],
  'C Programming': [
    { topic: 'Programming in C', subtopics: ['Data types', 'Operators', 'Control flow', 'Functions', 'Recursion'] },
    { topic: 'Arrays, Stacks & Queues', subtopics: ['1D/2D arrays', 'Stack operations', 'Queue variants'] },
    { topic: 'Linked Lists & Trees', subtopics: ['Singly/Doubly LL', 'Binary trees', 'BST', 'Binary heaps'] },
    { topic: 'Graphs', subtopics: ['Representation', 'BFS', 'DFS', 'Applications'] },
  ],
  'Algorithms': [
    { topic: 'Searching, Sorting & Hashing', subtopics: ['Binary search', 'Merge/Quick/Heap sort', 'Hash functions', 'Collision resolution'] },
    { topic: 'Complexity Analysis', subtopics: ['Asymptotic notation', 'Worst/average case', 'Space complexity'] },
    { topic: 'Algorithm Design Techniques', subtopics: ['Greedy', 'Dynamic programming', 'Divide & conquer'] },
    { topic: 'Graph Algorithms', subtopics: ['BFS/DFS traversal', 'Minimum spanning tree', 'Shortest paths: Dijkstra/Bellman-Ford'] },
  ],
  'OS': [
    { topic: 'Processes & Threads', subtopics: ['System calls', 'Process states', 'IPC', 'Concurrency'] },
    { topic: 'Synchronization & Deadlock', subtopics: ['Semaphores', 'Monitors', 'Deadlock detection', 'Banker\'s algorithm'] },
    { topic: 'CPU & I/O Scheduling', subtopics: ['FCFS/SJF/RR', 'Priority scheduling', 'I/O scheduling'] },
    { topic: 'Memory Management', subtopics: ['Paging', 'Segmentation', 'Virtual memory', 'Page replacement'] },
    { topic: 'File Systems', subtopics: ['File allocation', 'Directory structure', 'Inode', 'FAT'] },
  ],
  'DBMS': [
    { topic: 'ER Model & Relational Model', subtopics: ['ER diagram', 'Relational algebra', 'Tuple calculus', 'SQL'] },
    { topic: 'Integrity & Normalization', subtopics: ['Constraints', '1NF/2NF/3NF/BCNF', 'Functional dependencies'] },
    { topic: 'Indexing & File Organization', subtopics: ['B-tree', 'B+ tree', 'Dense/sparse index'] },
    { topic: 'Transactions & Concurrency', subtopics: ['ACID', 'Serializability', '2PL', 'Deadlock in DBMS'] },
  ],
  'Computer Networks': [
    { topic: 'Layered Architecture', subtopics: ['OSI model', 'TCP/IP stack', 'Packet/circuit switching'] },
    { topic: 'Data Link Layer', subtopics: ['Framing', 'Error detection', 'MAC', 'Ethernet bridging'] },
    { topic: 'Network Layer', subtopics: ['IP addressing', 'IPv4/CIDR', 'ARP/DHCP/ICMP', 'NAT', 'Routing protocols'] },
    { topic: 'Transport Layer', subtopics: ['TCP', 'UDP', 'Flow control', 'Congestion control', 'Sockets'] },
    { topic: 'Application Layer', subtopics: ['DNS', 'HTTP', 'SMTP', 'FTP', 'Email'] },
  ],
  'Theory of Computation': [
    { topic: 'Regular Languages & Automata', subtopics: ['DFA/NFA', 'Regular expressions', 'Pumping lemma for regular'] },
    { topic: 'Context-Free Languages', subtopics: ['CFG', 'PDA', 'Pumping lemma for CFL', 'Chomsky normal form'] },
    { topic: 'Turing Machines', subtopics: ['TM definition', 'Variants', 'Undecidability', 'Halting problem'] },
  ],
  'Compiler Design': [
    { topic: 'Lexical Analysis', subtopics: ['Tokens', 'Lexemes', 'Regular expressions', 'LEX tool'] },
    { topic: 'Parsing', subtopics: ['Top-down: LL(1)', 'Bottom-up: LR/LALR', 'Syntax-directed translation'] },
    { topic: 'Runtime & Code Generation', subtopics: ['Runtime environments', 'Intermediate code', 'Three-address code'] },
    { topic: 'Optimization', subtopics: ['Local optimization', 'Constant propagation', 'Liveness analysis', 'CSE elimination'] },
  ],
};

export const CDAC_SYLLABUS_TOPICS = {
  'Aptitude / Quant': [
    { topic: 'Quantitative Aptitude', subtopics: ['HCF & LCM', 'Percentages', 'Profit & Loss', 'Time-Speed-Distance', 'SI & CI'] },
    { topic: 'Logical Reasoning', subtopics: ['Blood relations', 'Seating arrangements', 'Series', 'Coding-decoding', 'Syllogisms'] },
    { topic: 'English Language', subtopics: ['Grammar', 'Vocabulary', 'Reading comprehension', 'Sentence rearrangement'] },
  ],
  'COA': [
    { topic: 'Computer Fundamentals', subtopics: ['CPU organization', 'Memory hierarchy', 'I/O devices', 'Generations of computers'] },
    { topic: 'Number Systems & Logic Gates', subtopics: ['Binary arithmetic', 'Hex/Octal conversions', 'Logic gates', 'Boolean algebra'] },
  ],
  'C Programming': [
    { topic: 'C Basics & Control Flow', subtopics: ['Data types', 'Operators', 'if-else/switch', 'Loops', 'Storage classes'] },
    { topic: 'Functions & Pointers', subtopics: ['Call by value/reference', 'Recursion', 'Pointer arithmetic', 'Dynamic allocation'] },
    { topic: 'Arrays, Strings & Structures', subtopics: ['Multidimensional arrays', 'String functions', 'Structures', 'Unions', 'Bit-fields'] },
    { topic: 'File Handling & Preprocessors', subtopics: ['File I/O', 'Macros', '#define', '#include'] },
  ],
  'Data Structures': [
    { topic: 'Linear Data Structures', subtopics: ['Arrays', 'Linked Lists', 'Stacks', 'Queues'] },
    { topic: 'Non-Linear Structures', subtopics: ['Binary Trees', 'BST', 'AVL Trees', 'Graphs: BFS/DFS'] },
    { topic: 'Sorting & Searching', subtopics: ['Bubble/Insertion/Selection', 'Merge/Quick/Heap sort', 'Binary search', 'Big-O notation'] },
    { topic: 'Hashing', subtopics: ['Hash functions', 'Collision resolution', 'Priority queues'] },
  ],
  'OS': [
    { topic: 'Process & CPU Scheduling', subtopics: ['Process states', 'Threads', 'FIFO/SJF/RR/Priority scheduling'] },
    { topic: 'Synchronization & Deadlock', subtopics: ['Semaphores', 'Critical section', 'Banker\'s algorithm'] },
    { topic: 'Memory & Virtual Memory', subtopics: ['Paging', 'Segmentation', 'Virtual memory', 'Page replacement: FIFO/LRU/Optimal'] },
  ],
  'Computer Networks': [
    { topic: 'OSI & TCP/IP Model', subtopics: ['7 OSI layers', 'TCP/IP layers', 'Protocols at each layer'] },
    { topic: 'Protocols & Addressing', subtopics: ['HTTP/FTP/DNS/TCP/UDP/IP/ARP/ICMP', 'IPv4 vs IPv6', 'Subnetting', 'MAC'] },
    { topic: 'Network Security', subtopics: ['Cryptography basics', 'Firewalls', 'VPN'] },
  ],
};
