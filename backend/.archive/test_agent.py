"""
Quickstart verification script for Agno framework installation.
Run: cd backend && uv run python test_agent.py
"""

from agno.agent import Agent
from agno.models.openrouter import OpenRouter
from agno.media import Image

# Initialize agent
agent = Agent(
    model=OpenRouter(id="anthropic/claude-3.5-sonnet"),
    markdown=True,
)

# Test text-only
print("=== Text Test ===")
agent.print_response("What is 2 + 2?", stream=True)

# Test with image (use any public image URL)
print("\n=== Vision Test ===")
image = Image(url="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Cat_poster_1.jpg/1200px-Cat_poster_1.jpg")
agent.print_response("What do you see in this image?", images=[image], stream=True)

print("\n=== Agno Installation Verified ===")
