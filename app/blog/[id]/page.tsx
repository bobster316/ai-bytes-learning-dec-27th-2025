"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft, Share2, Home, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Blog post data (same as in blog listing)
const blogPosts = {
  "1": {
    title: "Getting Started with AI: A Beginner's Guide",
    excerpt: "Learn the fundamentals of artificial intelligence and how to start your journey into this exciting field.",
    date: "2025-11-05",
    readTime: "5 min read",
    category: "Beginner",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=600&fit=crop",
    author: {
      name: "AI Bytes Team",
      avatar: "/ai-bytes-logo.png"
    },
    content: `
      <p class="lead">Artificial Intelligence is transforming every industry, and now is the perfect time to start learning. This comprehensive guide will walk you through the fundamentals and help you begin your AI journey.</p>

      <h2>What is Artificial Intelligence?</h2>
      <p>Artificial Intelligence (AI) refers to computer systems designed to perform tasks that typically require human intelligence. These tasks include visual perception, speech recognition, decision-making, and language translation.</p>

      <h2>Key Concepts to Understand</h2>
      <h3>Machine Learning</h3>
      <p>Machine Learning is a subset of AI that enables systems to learn and improve from experience without being explicitly programmed. It's the foundation of most modern AI applications.</p>

      <h3>Neural Networks</h3>
      <p>Inspired by the human brain, neural networks are computing systems designed to recognize patterns and solve complex problems through layers of interconnected nodes.</p>

      <h3>Deep Learning</h3>
      <p>Deep Learning uses multi-layered neural networks to process data with a structure similar to the human brain, enabling breakthroughs in image recognition, natural language processing, and more.</p>

      <h2>Getting Started: Your Learning Path</h2>
      <ol>
        <li><strong>Learn Python:</strong> The most popular programming language for AI development</li>
        <li><strong>Master Mathematics:</strong> Focus on linear algebra, calculus, and statistics</li>
        <li><strong>Understand Algorithms:</strong> Study common ML algorithms and when to use them</li>
        <li><strong>Practice with Projects:</strong> Build real-world applications to solidify your knowledge</li>
        <li><strong>Join the Community:</strong> Connect with other learners and professionals</li>
      </ol>

      <h2>Essential Resources</h2>
      <p>Start with these foundational courses and resources:</p>
      <ul>
        <li>Andrew Ng's Machine Learning course on Coursera</li>
        <li>Fast.ai's Practical Deep Learning for Coders</li>
        <li>Google's Machine Learning Crash Course</li>
        <li>Kaggle competitions for hands-on practice</li>
      </ul>

      <h2>Conclusion</h2>
      <p>Starting your AI journey might seem overwhelming, but with the right resources and consistent practice, you can master these concepts. Remember, every expert was once a beginner. Take it one step at a time, and you'll be amazed at your progress.</p>
    `
  },
  "2": {
    title: "Understanding Machine Learning Algorithms",
    excerpt: "Deep dive into the most popular machine learning algorithms and when to use each one.",
    date: "2025-11-03",
    readTime: "8 min read",
    category: "Intermediate",
    image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&h=600&fit=crop",
    author: {
      name: "AI Bytes Team",
      avatar: "/ai-bytes-logo.png"
    },
    content: `
      <p class="lead">Machine learning algorithms are the building blocks of AI systems. Understanding which algorithm to use and when is crucial for building effective solutions.</p>

      <h2>Supervised Learning Algorithms</h2>

      <h3>Linear Regression</h3>
      <p>Linear regression predicts continuous values based on input features. It's perfect for problems like price prediction, sales forecasting, and risk assessment.</p>
      <p><strong>Use when:</strong> You need to predict numerical values and have labeled training data.</p>

      <h3>Logistic Regression</h3>
      <p>Despite its name, logistic regression is used for classification problems. It predicts the probability of an instance belonging to a particular class.</p>
      <p><strong>Use when:</strong> You need binary classification (yes/no, true/false outcomes).</p>

      <h3>Decision Trees</h3>
      <p>Decision trees make decisions by learning simple decision rules from data. They're intuitive and easy to visualize.</p>
      <p><strong>Use when:</strong> You need interpretable models or have mixed data types.</p>

      <h3>Random Forests</h3>
      <p>An ensemble of decision trees that reduces overfitting and improves accuracy by combining multiple models.</p>
      <p><strong>Use when:</strong> You need high accuracy and can sacrifice some interpretability.</p>

      <h2>Unsupervised Learning Algorithms</h2>

      <h3>K-Means Clustering</h3>
      <p>Groups similar data points together without predefined labels. Excellent for customer segmentation and pattern discovery.</p>
      <p><strong>Use when:</strong> You want to discover natural groupings in your data.</p>

      <h3>Principal Component Analysis (PCA)</h3>
      <p>Reduces the dimensionality of data while preserving important information, making it easier to visualize and process.</p>
      <p><strong>Use when:</strong> You have high-dimensional data and need to reduce complexity.</p>

      <h2>Deep Learning Algorithms</h2>

      <h3>Convolutional Neural Networks (CNNs)</h3>
      <p>Specialized for processing grid-like data such as images. CNNs power facial recognition, autonomous vehicles, and medical image analysis.</p>
      <p><strong>Use when:</strong> Working with image or spatial data.</p>

      <h3>Recurrent Neural Networks (RNNs)</h3>
      <p>Designed for sequential data, making them perfect for time series prediction, language modeling, and speech recognition.</p>
      <p><strong>Use when:</strong> Dealing with sequential or time-series data.</p>

      <h2>Choosing the Right Algorithm</h2>
      <p>Consider these factors:</p>
      <ul>
        <li><strong>Problem type:</strong> Classification, regression, clustering, or dimensionality reduction?</li>
        <li><strong>Data size:</strong> Some algorithms need large datasets to perform well</li>
        <li><strong>Interpretability:</strong> Do you need to explain the model's decisions?</li>
        <li><strong>Training time:</strong> How quickly do you need results?</li>
        <li><strong>Accuracy requirements:</strong> How critical are prediction errors?</li>
      </ul>

      <h2>Practical Tips</h2>
      <ol>
        <li>Start simple - try linear models before complex neural networks</li>
        <li>Understand your data thoroughly before choosing an algorithm</li>
        <li>Use cross-validation to assess model performance</li>
        <li>Experiment with multiple algorithms and compare results</li>
        <li>Consider ensemble methods for better performance</li>
      </ol>
    `
  },
  "3": {
    title: "Prompt Engineering Best Practices",
    excerpt: "Master the art of crafting effective prompts for AI models like ChatGPT and other LLMs.",
    date: "2025-11-01",
    readTime: "6 min read",
    category: "Advanced",
    image: "https://images.unsplash.com/photo-1676573409381-c0d74a44f7ad?w=1200&h=600&fit=crop",
    author: {
      name: "AI Bytes Team",
      avatar: "/ai-bytes-logo.png"
    },
    content: `
      <p class="lead">Prompt engineering is the art and science of communicating effectively with large language models. Master these techniques to get better results from AI tools.</p>

      <h2>The Fundamentals of Prompt Engineering</h2>
      <p>A well-crafted prompt can mean the difference between mediocre and exceptional AI outputs. Understanding how to structure your prompts is essential for anyone working with LLMs.</p>

      <h2>Core Principles</h2>

      <h3>1. Be Clear and Specific</h3>
      <p>Vague prompts lead to vague results. Instead of "Write about AI," try "Write a 300-word introduction to neural networks for beginners, using simple analogies."</p>

      <h3>2. Provide Context</h3>
      <p>Give the AI enough background information to understand your request. Include relevant details about your audience, purpose, and constraints.</p>

      <h3>3. Use Examples</h3>
      <p>Show the AI what you want through examples. This "few-shot learning" approach dramatically improves output quality.</p>

      <h2>Advanced Techniques</h2>

      <h3>Chain-of-Thought Prompting</h3>
      <p>Ask the AI to explain its reasoning step-by-step. Add "Let's think through this step by step" to get more detailed, logical responses.</p>

      <h3>Role Assignment</h3>
      <p>Assign the AI a specific role: "You are an expert Python developer..." This frames the response in the appropriate context and expertise level.</p>

      <h3>Temperature and Parameters</h3>
      <p>Understand how to adjust model parameters:</p>
      <ul>
        <li><strong>Low temperature (0.1-0.3):</strong> More focused, deterministic outputs</li>
        <li><strong>High temperature (0.7-1.0):</strong> More creative, varied responses</li>
      </ul>

      <h2>Common Patterns</h2>

      <h3>The Instruction Pattern</h3>
      <pre><code>Task: [What you want done]
Context: [Relevant background]
Format: [How you want the output]
Constraints: [Any limitations]</code></pre>

      <h3>The Template Pattern</h3>
      <p>Create reusable templates for common tasks, filling in the blanks as needed.</p>

      <h2>Iterative Refinement</h2>
      <ol>
        <li>Start with a basic prompt</li>
        <li>Analyze the output</li>
        <li>Identify what's missing or incorrect</li>
        <li>Refine your prompt</li>
        <li>Repeat until satisfied</li>
      </ol>

      <h2>Best Practices Checklist</h2>
      <ul>
        <li>✓ Define the task clearly</li>
        <li>✓ Specify the desired format</li>
        <li>✓ Include relevant context</li>
        <li>✓ Set constraints and requirements</li>
        <li>✓ Use examples when helpful</li>
        <li>✓ Test and iterate</li>
        <li>✓ Document successful prompts</li>
      </ul>

      <h2>Avoiding Common Mistakes</h2>
      <ul>
        <li>Don't be too vague or too detailed</li>
        <li>Avoid ambiguous language</li>
        <li>Don't assume the AI has context it doesn't have</li>
        <li>Test prompts across different scenarios</li>
      </ul>
    `
  },
  "4": {
    title: "AI Ethics: Building Responsible AI Systems",
    excerpt: "Explore the ethical considerations and best practices for developing responsible AI applications.",
    date: "2025-10-28",
    readTime: "7 min read",
    category: "Ethics",
    image: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?w=1200&h=600&fit=crop",
    author: {
      name: "AI Bytes Team",
      avatar: "/ai-bytes-logo.png"
    },
    content: `
      <p class="lead">As AI becomes more powerful and prevalent, ensuring its ethical development and deployment is crucial for creating technology that benefits everyone.</p>

      <h2>Why AI Ethics Matters</h2>
      <p>AI systems make decisions that affect people's lives - from loan approvals to medical diagnoses. Without ethical guardrails, these systems can perpetuate biases, invade privacy, and cause harm.</p>

      <h2>Key Ethical Principles</h2>

      <h3>1. Fairness and Non-Discrimination</h3>
      <p>AI systems should treat all individuals and groups equitably, without bias based on race, gender, age, or other protected characteristics.</p>
      <p><strong>In practice:</strong> Regularly audit datasets and model outputs for bias, use diverse training data, and implement fairness metrics.</p>

      <h3>2. Transparency and Explainability</h3>
      <p>Users should understand how AI systems make decisions, especially in high-stakes scenarios.</p>
      <p><strong>In practice:</strong> Use interpretable models when possible, provide clear documentation, and explain AI-driven decisions to affected parties.</p>

      <h3>3. Privacy and Data Protection</h3>
      <p>Respect user privacy and handle personal data responsibly.</p>
      <p><strong>In practice:</strong> Implement data minimization, obtain informed consent, use encryption, and comply with regulations like GDPR.</p>

      <h3>4. Accountability</h3>
      <p>Establish clear responsibility for AI system outcomes.</p>
      <p><strong>In practice:</strong> Document decision-making processes, maintain audit trails, and create governance structures.</p>

      <h3>5. Safety and Security</h3>
      <p>Ensure AI systems are robust, reliable, and secure against attacks.</p>
      <p><strong>In practice:</strong> Conduct thorough testing, implement security measures, and plan for failure scenarios.</p>

      <h2>Addressing Bias in AI</h2>

      <h3>Types of Bias</h3>
      <ul>
        <li><strong>Data bias:</strong> Unrepresentative training data</li>
        <li><strong>Algorithmic bias:</strong> Flaws in the model design</li>
        <li><strong>Human bias:</strong> Biases of developers and users</li>
      </ul>

      <h3>Mitigation Strategies</h3>
      <ol>
        <li>Diverse, representative datasets</li>
        <li>Regular bias audits</li>
        <li>Diverse development teams</li>
        <li>Stakeholder involvement</li>
        <li>Continuous monitoring</li>
      </ol>

      <h2>Ethical AI Development Framework</h2>

      <h3>1. Planning Phase</h3>
      <ul>
        <li>Identify potential ethical risks</li>
        <li>Define success metrics beyond accuracy</li>
        <li>Engage stakeholders</li>
      </ul>

      <h3>2. Development Phase</h3>
      <ul>
        <li>Use diverse, representative data</li>
        <li>Implement fairness constraints</li>
        <li>Document decisions and trade-offs</li>
      </ul>

      <h3>3. Deployment Phase</h3>
      <ul>
        <li>Monitor for drift and bias</li>
        <li>Provide clear explanations</li>
        <li>Establish feedback mechanisms</li>
      </ul>

      <h3>4. Maintenance Phase</h3>
      <ul>
        <li>Regular audits</li>
        <li>Update based on feedback</li>
        <li>Reassess ethical implications</li>
      </ul>

      <h2>Regulatory Landscape</h2>
      <p>Stay informed about evolving AI regulations:</p>
      <ul>
        <li>EU AI Act</li>
        <li>GDPR (General Data Protection Regulation)</li>
        <li>CCPA (California Consumer Privacy Act)</li>
        <li>Industry-specific guidelines</li>
      </ul>

      <h2>Building an Ethical AI Culture</h2>
      <ul>
        <li>Foster open discussion about ethical concerns</li>
        <li>Provide ethics training for teams</li>
        <li>Include ethicists in development processes</li>
        <li>Create safe channels for raising concerns</li>
        <li>Reward ethical decision-making</li>
      </ul>

      <h2>Conclusion</h2>
      <p>Ethical AI isn't just about compliance - it's about building technology that enhances human capabilities while respecting human rights and dignity. By prioritizing ethics from the start, we can create AI systems that are not just powerful, but also trustworthy and beneficial.</p>
    `
  },
  "5": {
    title: "Python for AI: Essential Libraries You Need",
    excerpt: "Discover the must-know Python libraries for AI development including TensorFlow, PyTorch, and more.",
    date: "2025-10-25",
    readTime: "10 min read",
    category: "Programming",
    image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1200&h=600&fit=crop",
    author: {
      name: "AI Bytes Team",
      avatar: "/ai-bytes-logo.png"
    },
    content: `
      <p class="lead">Python has become the go-to language for AI development. Here are the essential libraries every AI developer should know.</p>

      <h2>Core Machine Learning Libraries</h2>

      <h3>NumPy - Numerical Computing</h3>
      <p>The foundation of scientific computing in Python. NumPy provides support for large multi-dimensional arrays and matrices.</p>
      <pre><code>import numpy as np
arr = np.array([1, 2, 3, 4, 5])
matrix = np.array([[1, 2], [3, 4]])</code></pre>

      <h3>Pandas - Data Manipulation</h3>
      <p>Essential for data cleaning, manipulation, and analysis. Pandas makes it easy to work with structured data.</p>
      <pre><code>import pandas as pd
df = pd.read_csv('data.csv')
df.describe()  # Get statistical summary</code></pre>

      <h3>Scikit-learn - Machine Learning</h3>
      <p>The most popular ML library for classical algorithms. Perfect for beginners and production systems.</p>
      <pre><code>from sklearn.ensemble import RandomForestClassifier
model = RandomForestClassifier()
model.fit(X_train, y_train)</code></pre>

      <h2>Deep Learning Frameworks</h2>

      <h3>TensorFlow & Keras</h3>
      <p>Google's powerful deep learning framework. Keras (now part of TensorFlow) provides a high-level API.</p>
      <pre><code>import tensorflow as tf
from tensorflow import keras

model = keras.Sequential([
    keras.layers.Dense(128, activation='relu'),
    keras.layers.Dense(10, activation='softmax')
])</code></pre>

      <h3>PyTorch</h3>
      <p>Facebook's deep learning library, favored by researchers for its flexibility and ease of use.</p>
      <pre><code>import torch
import torch.nn as nn

class NeuralNet(nn.Module):
    def __init__(self):
        super().__init__()
        self.layer1 = nn.Linear(784, 128)
        self.layer2 = nn.Linear(128, 10)</code></pre>

      <h2>Natural Language Processing</h2>

      <h3>NLTK - Natural Language Toolkit</h3>
      <p>Comprehensive library for text processing and linguistic analysis.</p>

      <h3>spaCy</h3>
      <p>Industrial-strength NLP library, optimized for production use.</p>

      <h3>Transformers (Hugging Face)</h3>
      <p>State-of-the-art pre-trained models for NLP tasks.</p>

      <h2>Computer Vision</h2>

      <h3>OpenCV</h3>
      <p>The gold standard for computer vision tasks.</p>

      <h3>Pillow (PIL)</h3>
      <p>Image processing library for Python.</p>

      <h2>Visualization Libraries</h2>

      <h3>Matplotlib</h3>
      <p>Create static, animated, and interactive visualizations.</p>

      <h3>Seaborn</h3>
      <p>Statistical data visualization built on Matplotlib.</p>

      <h3>Plotly</h3>
      <p>Interactive, publication-quality graphs.</p>

      <h2>Getting Started Tips</h2>
      <ol>
        <li>Start with NumPy and Pandas to build a strong foundation</li>
        <li>Learn Scikit-learn for classical ML algorithms</li>
        <li>Choose either TensorFlow or PyTorch for deep learning</li>
        <li>Add specialized libraries as needed for your projects</li>
        <li>Use virtual environments to manage dependencies</li>
      </ol>

      <h2>Installation</h2>
      <pre><code>pip install numpy pandas scikit-learn matplotlib
pip install tensorflow  # or pip install torch
pip install transformers opencv-python</code></pre>

      <h2>Best Practices</h2>
      <ul>
        <li>Use virtual environments (venv or conda)</li>
        <li>Pin library versions in requirements.txt</li>
        <li>Read the documentation</li>
        <li>Start with official tutorials</li>
        <li>Join community forums and discussions</li>
      </ul>
    `
  },
  "6": {
    title: "Natural Language Processing in 2025",
    excerpt: "The latest trends and breakthroughs in NLP, from transformers to multimodal models.",
    date: "2025-10-20",
    readTime: "9 min read",
    category: "NLP",
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=600&fit=crop",
    author: {
      name: "AI Bytes Team",
      avatar: "/ai-bytes-logo.png"
    },
    content: `
      <p class="lead">Natural Language Processing has evolved dramatically. Here's what's happening in NLP right now and where it's heading.</p>

      <h2>The Transformer Revolution</h2>
      <p>Transformers have fundamentally changed NLP. Models like GPT, BERT, and their successors have set new benchmarks across virtually every NLP task.</p>

      <h2>Current State-of-the-Art</h2>

      <h3>Large Language Models (LLMs)</h3>
      <p>Models with billions or trillions of parameters can now:</p>
      <ul>
        <li>Generate human-like text</li>
        <li>Translate between languages</li>
        <li>Answer complex questions</li>
        <li>Write code</li>
        <li>Summarize documents</li>
      </ul>

      <h3>Multimodal Models</h3>
      <p>The integration of text, images, and other modalities is creating more capable AI systems that understand context across different types of data.</p>

      <h2>Key Applications</h2>

      <h3>1. Conversational AI</h3>
      <p>Chatbots and virtual assistants are becoming more natural and helpful, understanding context and nuance better than ever.</p>

      <h3>2. Content Generation</h3>
      <p>From marketing copy to technical documentation, AI can now assist in creating various types of content.</p>

      <h3>3. Sentiment Analysis</h3>
      <p>Understanding emotions and opinions in text for customer feedback, social media monitoring, and market research.</p>

      <h3>4. Machine Translation</h3>
      <p>Real-time, high-quality translation across hundreds of languages.</p>

      <h3>5. Information Extraction</h3>
      <p>Automatically extracting structured data from unstructured text.</p>

      <h2>Emerging Trends</h2>

      <h3>Few-Shot and Zero-Shot Learning</h3>
      <p>Models can now perform tasks with minimal or no task-specific training data.</p>

      <h3>Prompt Engineering</h3>
      <p>The art of crafting inputs to get desired outputs from LLMs has become a crucial skill.</p>

      <h3>Efficient Models</h3>
      <p>Research into making models smaller and faster while maintaining performance.</p>

      <h3>Ethical AI</h3>
      <p>Addressing bias, fairness, and responsible use of NLP systems.</p>

      <h2>Challenges Ahead</h2>
      <ul>
        <li>Reducing computational costs</li>
        <li>Improving factual accuracy</li>
        <li>Addressing bias and fairness</li>
        <li>Ensuring privacy and security</li>
        <li>Making models more interpretable</li>
      </ul>

      <h2>Tools and Frameworks</h2>

      <h3>Hugging Face Transformers</h3>
      <p>The go-to library for working with pre-trained models.</p>

      <h3>spaCy</h3>
      <p>Industrial-strength NLP for production use.</p>

      <h3>LangChain</h3>
      <p>Framework for developing applications with LLMs.</p>

      <h2>Getting Started with NLP</h2>
      <ol>
        <li>Learn the fundamentals of text processing</li>
        <li>Understand how transformers work</li>
        <li>Experiment with pre-trained models</li>
        <li>Build projects using available tools</li>
        <li>Stay updated with latest research</li>
      </ol>

      <h2>The Future of NLP</h2>
      <p>We're moving toward AI systems that can:</p>
      <ul>
        <li>Understand context deeply</li>
        <li>Reason about complex topics</li>
        <li>Learn continuously</li>
        <li>Interact naturally across modalities</li>
        <li>Assist humans more effectively</li>
      </ul>

      <h2>Conclusion</h2>
      <p>NLP is one of the most exciting and rapidly evolving areas of AI. Whether you're a beginner or an experienced practitioner, there's never been a better time to dive into this field.</p>
    `
  }
};

export default function BlogPostPage() {
  const params = useParams();
  const postId = params.id as string;
  const post = blogPosts[postId as keyof typeof blogPosts];

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Post Not Found</h1>
          <Link href="/blog">
            <button className="text-[#00BFA5] hover:underline">
              ← Back to Blog
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-card">
      {/* Navigation Breadcrumb */}
      <nav className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-foreground/70">
              <Link href="/" className="flex items-center gap-1 hover:text-[#00BFA5] transition-colors">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/blog" className="hover:text-[#00BFA5] transition-colors">
                Blog
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium truncate max-w-[200px] md:max-w-[400px]">
                {post.title}
              </span>
            </div>

            {/* Quick Navigation Links */}
            <div className="flex items-center gap-6 text-sm">
              <Link href="/" className="text-foreground/70 hover:text-[#00BFA5] transition-colors">
                Home
              </Link>
              <Link href="/courses" className="text-foreground/70 hover:text-[#00BFA5] transition-colors">
                Courses
              </Link>
              <Link href="/pricing" className="text-foreground/70 hover:text-[#00BFA5] transition-colors">
                Pricing
              </Link>
              <Link href="/about" className="text-foreground/70 hover:text-[#00BFA5] transition-colors">
                About
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Image */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Article Content */}
      <article className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link href="/blog" className="inline-flex items-center gap-2 text-foreground/80 hover:text-[#00BFA5] transition-colors mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          {/* Article Header */}
          <div className="bg-card rounded-2xl shadow-xl p-8 md:p-12 mb-8 border border-border">
            <Badge className="bg-[#00BFA5] text-foreground-inverse mb-4">
              {post.category}
            </Badge>

            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {post.title}
            </h1>

            <div className="flex items-center gap-6 text-foreground/60">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(post.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
              <button className="flex items-center gap-2 hover:text-[#00BFA5] transition-colors ml-auto">
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>

          {/* Article Body */}
          <div className="bg-card rounded-2xl shadow-xl p-8 md:p-12 border border-border">
            <div
              className="prose prose-lg max-w-none
                prose-headings:text-foreground prose-headings:font-bold
                prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-[#00BFA5] prose-a:no-underline hover:prose-a:underline
                prose-strong:text-foreground prose-strong:font-semibold
                prose-ul:my-6 prose-ol:my-6
                prose-li:text-foreground/80 prose-li:my-2
                prose-code:text-[#00BFA5] prose-code:bg-border prose-code:px-2 prose-code:py-1 prose-code:rounded
                prose-pre:bg-border prose-pre:text-foreground
                dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Author Section */}
          <div className="bg-card rounded-2xl shadow-xl p-8 mt-8 border border-border">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-background-inverse flex items-center justify-center p-3 flex-shrink-0">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="font-semibold text-foreground">Written by</p>
                <p className="text-lg text-foreground">{post.author.name}</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-[#00BFA5] to-[#00A896] rounded-2xl shadow-xl p-8 mt-8 text-center">
            <h3 className="text-2xl font-bold text-foreground-inverse mb-4">
              Ready to Learn More?
            </h3>
            <p className="text-foreground-inverse/90 mb-6">
              Explore our AI courses and take your skills to the next level
            </p>
            <Link href="/courses">
              <button className="bg-background text-foreground px-8 py-3 rounded-lg font-semibold hover:bg-background/90 transition-colors shadow-lg">
                Browse Courses
              </button>
            </Link>
          </div>
        </div>
      </article>

      {/* Spacing */}
      <div className="h-16" />
    </div>
  );
}
