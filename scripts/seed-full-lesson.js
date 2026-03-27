const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const blocks = [
  {
    id: 'b-01', type: 'lesson_header', order: 1,
    title: 'How Machines Learn to See',
    titleEmphasis: 'Learn to See',
    tag: 'Core Concept',
    duration: '14 min',
    difficulty: 'Beginner',
    questionCount: 4,
    description: 'Discover how artificial neural networks transform raw data into understanding — layer by layer, weight by weight.',
    objectives: [
      'Explain how data flows through a neural network',
      'Describe what weights and activations do',
      'Identify the role of backpropagation in training',
      'Distinguish biological from artificial neurons'
    ]
  },
  {
    id: 'b-02', type: 'text', order: 2,
    heading: 'Biology vs **Silicon**',
    sectionLabel: '01 — Foundation',
    paragraphs: [
      'Your brain contains roughly <strong>86 billion neurons</strong>, each connected to thousands of others. Every thought, memory, and perception emerges from electrical signals cascading through this network.',
      'Artificial neural networks borrow this architecture. Instead of biology, they use mathematics — numbers flowing through layers of weighted connections, shaped by training data until patterns emerge.',
      'The key insight: a neural network does not memorise facts. It learns statistical relationships. After training on millions of images, it does not store a picture of a cat — it stores the <em>pattern</em> of what makes something cat-like.'
    ]
  },
  {
    id: 'b-03', type: 'callout', order: 3,
    variant: 'tip',
    icon: '💡',
    title: 'The core distinction',
    body: 'Traditional software follows rules you write. A neural network discovers its own rules from examples. You show it 10,000 labelled images — it figures out the pattern itself.'
  },
  {
    id: 'b-04', type: 'type_cards', order: 4,
    heading: 'Three layers of every network',
    cards: [
      { title: 'Input Layer', description: 'Receives raw data — pixels, numbers, tokens. Each neuron represents one feature. No computation happens here; this is the senses of the network.', badge: 'Entry Point', badgeColour: 'pulse', icon: '◈', imagePrompt: 'abstract data flow into a grid' },
      { title: 'Hidden Layers', description: 'Where learning happens. Neurons combine inputs, apply weights, and pass results forward. Deep networks stack dozens of these layers.', badge: 'Processing', badgeColour: 'iris', icon: '◇', imagePrompt: 'interconnected nodes glowing' },
      { title: 'Output Layer', description: 'Produces the final prediction — a class label, a number, a probability distribution. Its structure depends entirely on the task.', badge: 'Decision', badgeColour: 'amber', icon: '△', imagePrompt: 'single bright node emitting signal' },
      { title: 'Weights & Bias', description: 'Numbers attached to every connection. During training they are adjusted thousands of times until the network produces correct answers.', badge: 'Learned', badgeColour: 'pulse', icon: '○', imagePrompt: 'numerical values adjusting on edges' }
    ]
  },
  {
    id: 'b-05', type: 'flow_diagram', order: 5,
    heading: 'How a Neural Network Learns',
    steps: [
      { label: 'Input Data', description: 'Raw pixels or numbers enter the network', colour: 'pulse' },
      { label: 'Forward Pass', description: 'Data flows through layers, activations fire', colour: 'iris' },
      { label: 'Loss Calculated', description: 'Error measured against correct answer', colour: 'amber' },
      { label: 'Backpropagation', description: 'Error signal flows backwards through layers', colour: 'nova' },
      { label: 'Weights Updated', description: 'Gradient descent adjusts all connections', colour: 'pulse' }
    ]
  },
  {
    id: 'b-06', type: 'punch_quote', order: 6,
    quote: 'A neural network does not understand. It approximates. The miracle is that approximation, done at scale, looks a great deal like understanding.',
    attribution: 'Geoffrey Hinton',
    accent: 'iris'
  },
  {
    id: 'b-07', type: 'image_text_row', order: 7,
    sectionLabel: '02 — Inside the Network',
    label: 'Step Inside the Network',
    title: 'Step **Inside** the Network',
    text: 'Each hidden layer learns to detect increasingly abstract features. Early layers spot edges and colours. Deeper layers recognise textures, motifs, and eventually objects — without ever being told explicitly what to look for. Layer 1 activates on horizontal lines. Layer 4 activates on the concept of "eye".',
    imagePrompt: 'abstract neural network layers visualised as glowing depth',
    imageAlt: 'Neural network layers diagram',
    reverse: false
  },
  {
    id: 'b-08', type: 'prediction', order: 8,
    question: 'A neural network encounters an image it has never seen before. What actually happens inside it?',
    options: [
      'It searches a database of stored images for the closest match',
      'It passes the image through learned weight matrices to produce a probability distribution',
      'It asks the training data for guidance on the new example'
    ],
    correctIndex: 1,
    reveal: 'Correct. The network applies learned weights layer by layer — no database lookup, no memory of training examples. Just matrix multiplication and activation functions producing a probability score for each class.'
  },
  {
    id: 'b-09', type: 'mindmap', order: 9,
    centralNode: 'Neural Network',
    branches: [
      { label: 'Weights', description: 'Learned parameters', colour: 'pulse' },
      { label: 'Gradient', description: 'Direction of improvement', colour: 'iris' },
      { label: 'Data', description: 'Training examples', colour: 'amber' },
      { label: 'Activation', description: 'Non-linearity', colour: 'nova' },
      { label: 'Backprop', description: 'Error signal', colour: 'iris' }
    ]
  },
  {
    id: 'b-10', type: 'industry_tabs', order: 10,
    heading: 'Neural Networks Across Industries',
    introText: 'From diagnosing diseases to driving cars — how the same architecture powers radically different applications.',
    tabs: [
      { id: 'tab-health', label: 'Healthcare', icon: '🏥', scenarioTitle: 'Diagnosing Retinal Disease', scenarioBody: 'Convolutional networks diagnose diabetic retinopathy from retinal scans with 94% accuracy — matching specialist ophthalmologists. DeepMind solved the 50-year protein folding problem with AlphaFold.', imagePrompt: 'medical retinal scan with AI overlay', imageCaption: 'AI diagnosis at specialist accuracy' },
      { id: 'tab-finance', label: 'Finance', icon: '📈', scenarioTitle: 'Real-Time Fraud Detection', scenarioBody: 'Recurrent networks detect fraud in real time by learning normal spending patterns and flagging anomalies instantly. JPMorgan reviews 12,000 annual credit agreements in seconds.', imagePrompt: 'financial data streams with anomaly highlighted', imageCaption: 'Pattern anomalies caught in milliseconds' },
      { id: 'tab-auto', label: 'Automotive', icon: '🚗', scenarioTitle: 'Eight-Camera Perception', scenarioBody: 'Tesla Autopilot processes eight camera feeds simultaneously using convolutional networks to identify lane markings, pedestrians, and vehicles at 50ms latency.', imagePrompt: 'car surrounded by sensor data overlays', imageCaption: '50ms perception cycle at highway speed' },
      { id: 'tab-science', label: 'Science', icon: '🔬', scenarioTitle: 'Protein Folding Solved', scenarioBody: 'Graph neural networks predict molecular properties, accelerating materials discovery. DeepMind weather model outperforms traditional simulation at 0.1% of the compute cost.', imagePrompt: 'protein structure rendered in 3D', imageCaption: '50-year problem solved in months' }
    ]
  },
  {
    id: 'b-11', type: 'applied_case', order: 11,
    scenario: 'Google Photos runs a lightweight MobileNet — a compressed convolutional network — entirely on your device. It processes every photo at upload, generating a 128-dimensional face embedding that uniquely describes each person.',
    challenge: 'Recognising faces accurately on a mobile CPU with under 50ms latency and no network round-trip, across billions of photos with varied lighting, angles, and ages.',
    resolution: 'MobileNet\'s depthwise separable convolutions reduced the parameter count from 140M to just 3.4M while maintaining 99.6% accuracy. Similar face embeddings cluster automatically — enabling grouping without cloud processing.'
  },
  {
    id: 'b-12', type: 'quiz', order: 12,
    title: 'Knowledge Check',
    questions: [
      {
        questionNumber: 1,
        totalQuestions: 3,
        questionType: 'multiple_choice',
        questionText: 'What does backpropagation actually calculate?',
        options: [
          { letter: 'A', text: 'The number of neurons that fired', isCorrect: false },
          { letter: 'B', text: 'How much each weight contributed to the error', isCorrect: true },
          { letter: 'C', text: 'The optimal learning rate for the next epoch', isCorrect: false },
          { letter: 'D', text: 'Which training examples to remove', isCorrect: false }
        ],
        correctFeedback: 'Backpropagation uses the chain rule of calculus to compute the gradient of the loss with respect to every weight — telling us exactly how to adjust each connection to reduce the error.',
        incorrectFeedback: 'Not quite. Backpropagation is specifically about calculating gradients — how much each weight contributed to the total error.',
        xpReward: 20
      },
      {
        questionNumber: 2,
        totalQuestions: 3,
        questionType: 'multiple_choice',
        questionText: 'Why do neural networks need activation functions?',
        options: [
          { letter: 'A', text: 'To speed up matrix multiplication', isCorrect: false },
          { letter: 'B', text: 'To introduce non-linearity so the network can learn complex patterns', isCorrect: true },
          { letter: 'C', text: 'To reduce the number of parameters', isCorrect: false },
          { letter: 'D', text: 'To prevent the weights from going negative', isCorrect: false }
        ],
        correctFeedback: 'Without non-linear activation functions, stacking layers is equivalent to a single linear transformation. Activations like ReLU allow networks to approximate any function, however complex.',
        incorrectFeedback: 'Without activations, stacking layers collapses to a single linear transform. The non-linearity is what gives deep networks their expressive power.',
        xpReward: 20
      },
      {
        questionNumber: 3,
        totalQuestions: 3,
        questionType: 'multiple_choice',
        questionText: 'What problem does dropout regularisation solve?',
        options: [
          { letter: 'A', text: 'Slow training speed', isCorrect: false },
          { letter: 'B', text: 'Overfitting to training data', isCorrect: true },
          { letter: 'C', text: 'Vanishing gradients', isCorrect: false },
          { letter: 'D', text: 'Class imbalance', isCorrect: false }
        ],
        correctFeedback: 'Dropout randomly disables neurons during training, forcing the network to learn redundant representations. This prevents it from memorising the training set and improves generalisation.',
        incorrectFeedback: 'Dropout is a regularisation technique. Its purpose is to prevent the network from overfitting by randomly silencing neurons during each training step.',
        xpReward: 20
      }
    ]
  },
  {
    id: 'b-13', type: 'go_deeper', order: 13,
    triggerText: 'Go deeper: The Vanishing Gradient Problem',
    content: 'In networks deeper than about 5 layers, gradients from backpropagation shrink exponentially as they travel backwards. By the time the signal reaches early layers, it is too small to update weights meaningfully — those layers stop learning. This is the vanishing gradient problem. The breakthrough came from two sources: the ReLU activation function (which passes gradients unchanged for positive values) and residual connections (which provide gradient highways that skip multiple layers). Together they made training 100+ layer networks possible.'
  },
  {
    id: 'b-14', type: 'key_terms', order: 14,
    terms: [
      { term: 'Epoch', definition: 'One complete pass through the entire training dataset. Networks typically train for 10-1000 epochs.' },
      { term: 'Learning Rate', definition: 'How large a step to take when updating weights. Too high: training diverges. Too low: training is extremely slow.' },
      { term: 'Overfitting', definition: 'When a network memorises the training data rather than learning general patterns. Performance is high on training data but poor on new examples.' },
      { term: 'Batch Normalisation', definition: 'Normalises the inputs to each layer during training. Stabilises training and allows much higher learning rates.' },
      { term: 'Transformer', definition: 'Architecture based entirely on attention mechanisms. Powers GPT, BERT, and most modern language models.' }
    ]
  },
  {
    id: 'b-15', type: 'open_exercise', order: 15,
    instruction: 'You need to train a neural network to recognise handwritten digits. Define the architecture by completing each section below.',
    weakPrompt: 'Just use a neural network with some layers to detect numbers.',
    scaffoldLabels: ['Input Layer', 'Hidden Layer Design', 'Activation Function', 'Output Layer'],
    modelAnswer: 'Input: 784 neurons (28×28 pixel values, flattened). Hidden: 2 dense layers of 128 neurons each. Activation: ReLU after each hidden layer for non-linearity. Output: 10 neurons with softmax — one probability per digit class (0–9).',
    accentColour: 'pulse'
  },
  {
    id: 'b-16', type: 'recap', order: 16,
    title: 'If you remember only three things...',
    points: [
      'Neural networks learn statistical relationships from examples — not explicit rules programmed by humans',
      'Backpropagation calculates how much each weight contributed to the error, enabling gradient descent to improve the network',
      'Deep architectures solved the vanishing gradient problem with ReLU activations and residual connections'
    ]
  },
  {
    id: 'b-17', type: 'completion', order: 17,
    title: 'You understand neural networks',
    subtitle: 'The mathematics of machine perception',
    xpTotal: 120,
    skillsEarned: [
      { label: 'How data flows through layers', colour: 'pulse' },
      { label: 'The role of weights and activations', colour: 'iris' },
      { label: 'How backpropagation trains a network', colour: 'amber' }
    ],
    nextModuleTitle: '',
    nextModuleAction: ''
  }
];

sb.from('course_lessons')
  .update({ content_blocks: blocks })
  .eq('id', '3472')
  .select('id')
  .then(({ data, error }) => {
    if (error) console.log('ERR:', error.message);
    else console.log('SUCCESS — lesson 3472 updated with', blocks.length, 'blocks');
  });
