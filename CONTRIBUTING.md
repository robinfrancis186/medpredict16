# Contributing to MedPredict

Thank you for your interest in contributing to MedPredict! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Bug Reports](#bug-reports)
- [Feature Requests](#feature-requests)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

### Our Standards

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/medpredict16.git
   cd medpredict16
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/robinfrancis186/medpredict16.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

## How to Contribute

### Types of Contributions

We welcome the following types of contributions:

- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- ♿ Accessibility improvements
- 🔧 Code refactoring
- ✅ Test coverage
- 🌐 Translations

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
# For new features
git checkout -b feature/your-feature-name

# For bug fixes
git checkout -b fix/issue-description

# For documentation
git checkout -b docs/what-you-are-documenting
```

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments where necessary
- Update documentation as needed

### 3. Test Your Changes

Before submitting, ensure:

```bash
# Lint your code
npm run lint

# Build the project
npm run build

# Test in development mode
npm run dev
```

### 4. Keep Your Branch Updated

Regularly sync with the upstream repository:

```bash
git fetch upstream
git rebase upstream/main
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid using `any` type when possible
- Use strict mode

### React

- Use functional components with hooks
- Follow React best practices
- Keep components small and focused
- Use proper prop types

### File Structure

- Place components in `src/components/`
- Place pages in `src/pages/`
- Place utilities in `src/lib/`
- Place types in `src/types/`

### Naming Conventions

- **Components**: PascalCase (e.g., `PatientCard.tsx`)
- **Functions**: camelCase (e.g., `fetchPatientData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Files**: kebab-case or PascalCase for components

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons at the end of statements
- Use trailing commas in objects and arrays
- Maximum line length: 100 characters

### CSS/Tailwind

- Use Tailwind utility classes
- Keep custom CSS minimal
- Use CSS modules if custom styles are needed
- Follow mobile-first approach

## Commit Messages

Write clear and meaningful commit messages:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(dashboard): add patient statistics chart

fix(auth): resolve login redirect issue

docs(readme): update installation instructions

style(components): format PatientCard component

refactor(api): simplify data fetching logic

test(vitals): add unit tests for vitals monitor

chore(deps): update dependencies
```

## Pull Request Process

### Before Submitting

1. ✅ Ensure your code follows the coding standards
2. ✅ Run linter and fix any issues
3. ✅ Test your changes thoroughly
4. ✅ Update documentation if needed
5. ✅ Rebase your branch on the latest main
6. ✅ Write a clear PR description

### PR Description Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactoring
- [ ] Other (please describe)

## Changes Made
- List of changes
- Another change
- etc.

## Testing
Describe how you tested your changes

## Screenshots (if applicable)
Add screenshots of UI changes

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code where necessary
- [ ] I have updated the documentation
- [ ] My changes generate no new warnings
- [ ] I have tested my changes
```

### Review Process

1. At least one maintainer will review your PR
2. Address any feedback or requested changes
3. Once approved, a maintainer will merge your PR

## Bug Reports

### Before Submitting a Bug Report

- Check if the bug has already been reported
- Ensure you're using the latest version
- Try to reproduce the issue

### Bug Report Template

When submitting a bug report, include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Numbered steps to reproduce the issue
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Environment**:
   - OS: [e.g., Windows 10, macOS 12, Ubuntu 20.04]
   - Browser: [e.g., Chrome 96, Firefox 95]
   - Node.js version: [e.g., 18.12.0]
7. **Additional Context**: Any other relevant information

## Feature Requests

### Feature Request Template

When submitting a feature request, include:

1. **Problem Statement**: What problem does this solve?
2. **Proposed Solution**: Your suggested implementation
3. **Alternatives Considered**: Other solutions you've thought about
4. **Additional Context**: Any other relevant information
5. **Mockups/Examples**: Visual examples if applicable

## Questions?

If you have questions, feel free to:

- Open an issue with the `question` label
- Contact the maintainers
- Check existing documentation

## License

By contributing to MedPredict, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to MedPredict! 🎉
