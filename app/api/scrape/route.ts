import { NextResponse } from "next/server";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import * as cheerio from "cheerio";

export async function POST(request: Request) {
  const { url, imageUrl } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  // Handle mock/example URLs - return mock article content
  if (url.includes('example.com')) {
    const mockArticles: Record<string, any> = {
      'future-of-ai': {
        title: 'The Future of AI: What to Expect in the Next Decade',
        articleBody: `
          <h2>Transforming Industries Through Artificial Intelligence</h2>
          <p>Artificial intelligence is poised to revolutionize virtually every industry over the next decade. From healthcare to finance, transportation to entertainment, AI technologies are becoming increasingly sophisticated and accessible.</p>

          <h3>Key Trends to Watch</h3>
          <p><strong>1. Generative AI Evolution:</strong> Tools like ChatGPT and DALL-E are just the beginning. We'll see more powerful and specialized generative models that can create entire software applications, design products, and assist in complex decision-making.</p>

          <p><strong>2. AI in Healthcare:</strong> Machine learning models will continue to improve diagnostic accuracy, drug discovery, and personalized treatment plans. AI-powered tools will help doctors identify diseases earlier and more accurately than ever before.</p>

          <p><strong>3. Autonomous Systems:</strong> Self-driving vehicles, drones, and robots will become more prevalent, transforming logistics, transportation, and manufacturing sectors.</p>

          <p><strong>4. AI Ethics and Regulation:</strong> As AI becomes more powerful, there will be increased focus on ethical AI development, bias mitigation, and regulatory frameworks to ensure responsible use.</p>

          <h3>Preparing for an AI-Driven Future</h3>
          <p>Experts recommend that businesses and individuals stay informed about AI developments, invest in AI literacy, and consider how AI can augment rather than replace human capabilities. The future of work will likely involve close collaboration between humans and AI systems.</p>

          <p>The next decade promises to be transformative, with AI touching nearly every aspect of our daily lives. Those who understand and embrace these technologies will be well-positioned for success in this new era.</p>
        `
      },
      'ai-in-healthcare': {
        title: 'How AI is Revolutionizing the Healthcare Industry',
        articleBody: `
          <h2>Transforming Patient Care with Artificial Intelligence</h2>
          <p>The healthcare industry is experiencing a revolution driven by artificial intelligence. From early disease detection to personalized treatment plans, AI is improving patient outcomes and making healthcare more efficient and accessible.</p>

          <h3>Diagnostic Excellence</h3>
          <p>AI-powered diagnostic tools can analyze medical images with remarkable accuracy. Machine learning models trained on millions of scans can detect cancers, neurological conditions, and other diseases often earlier and more accurately than traditional methods.</p>

          <p>Studies have shown that AI systems can match or exceed the performance of experienced radiologists in identifying certain conditions, while processing images much faster.</p>

          <h3>Drug Discovery and Development</h3>
          <p>Pharmaceutical companies are using AI to accelerate drug discovery, reducing the time and cost of bringing new treatments to market. AI can analyze vast databases of molecular structures, predict drug interactions, and identify promising candidates for clinical trials.</p>

          <h3>Personalized Medicine</h3>
          <p>AI enables truly personalized treatment plans by analyzing a patient's genetic makeup, medical history, and lifestyle factors. This approach ensures that each patient receives the most effective treatment for their unique situation.</p>

          <h3>Administrative Efficiency</h3>
          <p>Beyond clinical applications, AI is streamlining hospital operations, managing patient records, scheduling appointments, and reducing administrative burden on healthcare professionals.</p>

          <p>As AI technology continues to advance, we can expect even more innovative applications that will further transform how we approach healthcare and improve patient outcomes worldwide.</p>
        `
      },
      'ai-ethics': {
        title: 'Ethical Considerations of Advanced AI Systems',
        articleBody: `
          <h2>Navigating the Ethical Landscape of AI</h2>
          <p>As artificial intelligence systems become more powerful and pervasive, addressing ethical considerations has never been more critical. The decisions we make today about AI development and deployment will shape society for generations to come.</p>

          <h3>Bias and Fairness</h3>
          <p>One of the most pressing ethical concerns is algorithmic bias. AI systems trained on historical data can perpetuate and amplify existing societal biases. This can lead to discriminatory outcomes in areas like hiring, lending, and criminal justice.</p>

          <p>Researchers and developers are working on techniques to detect and mitigate bias, but this remains an ongoing challenge that requires constant vigilance.</p>

          <h3>Privacy and Data Protection</h3>
          <p>AI systems often require vast amounts of data to function effectively. This raises important questions about privacy, consent, and data ownership. How do we balance the benefits of AI with individuals' right to privacy?</p>

          <h3>Transparency and Explainability</h3>
          <p>Many advanced AI systems operate as "black boxes," making decisions in ways that are difficult for humans to understand. This lack of transparency can be problematic, especially in high-stakes applications like healthcare or criminal justice.</p>

          <h3>Accountability and Responsibility</h3>
          <p>When an AI system makes a mistake or causes harm, who is responsible? The developers? The deployers? The users? Establishing clear lines of accountability is essential for building trust in AI systems.</p>

          <h3>Moving Forward Responsibly</h3>
          <p>Addressing these ethical challenges requires collaboration between technologists, ethicists, policymakers, and the public. We need robust frameworks for ethical AI development, comprehensive regulations, and ongoing dialogue about the values we want our AI systems to embody.</p>

          <p>The goal is not to slow down AI progress, but to ensure it benefits humanity while minimizing potential harms.</p>
        `
      },
      'generative-ai': {
        title: 'The Rise of Generative AI in Creative Industries',
        articleBody: `
          <h2>Unlocking New Creative Possibilities</h2>
          <p>Generative AI is transforming creative industries, enabling artists, writers, musicians, and designers to push the boundaries of what's possible. These powerful tools are not replacing human creativity—they're amplifying it.</p>

          <h3>Visual Arts and Design</h3>
          <p>AI image generation tools like DALL-E, Midjourney, and Stable Diffusion allow artists to explore new styles, generate concept art rapidly, and create visuals that would be time-prohibitive with traditional methods.</p>

          <p>Designers are using AI to generate multiple design variations quickly, explore color schemes, and create custom illustrations tailored to specific needs.</p>

          <h3>Writing and Content Creation</h3>
          <p>Large language models are assisting writers with brainstorming, drafting, editing, and even generating entire articles. While AI-generated text still requires human oversight and refinement, these tools are significantly boosting productivity.</p>

          <p>Marketing teams use AI to generate copy variations, product descriptions, and social media content, freeing up time for strategic creative work.</p>

          <h3>Music and Audio</h3>
          <p>AI music generators can compose original pieces, create backing tracks, and even mimic specific musical styles. Musicians are using these tools for inspiration, to overcome creative blocks, and to explore new sonic territories.</p>

          <h3>The Human-AI Creative Partnership</h3>
          <p>The most exciting applications of generative AI involve human-AI collaboration. Artists provide creative direction, make aesthetic judgments, and refine AI-generated outputs. The result is work that combines machine efficiency with human creativity and taste.</p>

          <h3>Ethical Considerations</h3>
          <p>The rise of generative AI raises important questions about authorship, copyright, and the value of human creativity. The creative community is grappling with how to embrace these tools while preserving what makes human artistry special.</p>

          <p>As these technologies continue to evolve, we're likely to see entirely new forms of creative expression emerge from the intersection of human imagination and AI capability.</p>
        `
      }
    };

    // Extract the article key from the URL
    const urlParts = url.split('/');
    const articleKey = urlParts[urlParts.length - 1];

    const mockArticle = mockArticles[articleKey];

    if (mockArticle) {
      return NextResponse.json(mockArticle);
    }

    // If no mock article found, return error
    return NextResponse.json(
      { error: "Article not found" },
      { status: 404 }
    );
  }

  try {
    // Fetch the HTML with a realistic User-Agent header to mimic a real browser
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch the article. Status: ${response.status}`);
    }

    const html = await response.text();

    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (!article) {
      return NextResponse.json(
        { error: "Failed to parse article content with Readability" },
        { status: 500 }
      );
    }

    const $ = cheerio.load(article.content);

    // Remove the featured image if it's present in the body
    if (imageUrl) {
      $(`img[src="${imageUrl}"]`).remove();
    }

    const cleanedContent = $('body').html();

    return NextResponse.json({ title: article.title, articleBody: cleanedContent });

  } catch (error) {
    console.error("Simplified scraping error:", error);
    return NextResponse.json(
      { error: "Failed to scrape the article using the simplified scraper." },
      { status: 500 }
    );
  }
}
