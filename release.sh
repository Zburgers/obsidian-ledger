#!/bin/bash
# Release script for Zorvyn FinTrack MVP
# Automatically bumps version, creates a git tag, and prepares for release
# 
# Usage:
#   ./release.sh patch    # Bump patch version (e.g., 0.0.1 -> 0.0.2)
#   ./release.sh minor    # Bump minor version (e.g., 0.1.0 -> 0.2.0)
#   ./release.sh major    # Bump major version (e.g., 1.0.0 -> 2.0.0)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if version argument is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Version type not specified${NC}"
    echo "Usage: ./release.sh [patch|minor|major]"
    exit 1
fi

VERSION_TYPE=$1

# Validate version type
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo -e "${RED}Error: Invalid version type '$VERSION_TYPE'${NC}"
    echo "Valid options: patch, minor, major"
    exit 1
fi

# Get current version from git tags
CURRENT_VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "0.0.0")
# Remove 'v' prefix if present
CURRENT_VERSION=${CURRENT_VERSION#v}

echo -e "${BLUE}Current version: ${GREEN}$CURRENT_VERSION${NC}"

# Parse version
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
MAJOR=${MAJOR:-0}
MINOR=${MINOR:-0}
PATCH=${PATCH:-0}

# Bump version based on type
case $VERSION_TYPE in
    patch)
        PATCH=$((PATCH + 1))
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
TAG_NAME="v$NEW_VERSION"

echo -e "${BLUE}New version: ${GREEN}$NEW_VERSION${NC}"
echo -e "${BLUE}Tag name: ${GREEN}$TAG_NAME${NC}"

# Check if tag already exists
if git rev-parse "$TAG_NAME" >/dev/null 2>&1; then
    echo -e "${RED}Error: Tag '$TAG_NAME' already exists${NC}"
    exit 1
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}Error: You have uncommitted changes. Please commit or stash them first.${NC}"
    exit 1
fi

# Confirm with user
echo -e "${YELLOW}Ready to create release $TAG_NAME?${NC}"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Release cancelled."
    exit 1
fi

# Create annotated git tag
echo -e "${BLUE}Creating git tag: $TAG_NAME${NC}"
git tag -a "$TAG_NAME" -m "Release version $NEW_VERSION"

# Push tag to remote
echo -e "${BLUE}Pushing tag to remote...${NC}"
git push origin "$TAG_NAME"

echo -e "${GREEN}✓ Release $TAG_NAME created successfully!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Push your changes: git push origin"
echo "2. Create a GitHub release at: https://github.com/Zburgers/obsidian-ledger/releases/new?tag=$TAG_NAME"
echo "3. Add release notes describing changes in this version"
echo ""
echo -e "${BLUE}Current tags:${NC}"
git tag -l --sort=-version:refname | head -5
