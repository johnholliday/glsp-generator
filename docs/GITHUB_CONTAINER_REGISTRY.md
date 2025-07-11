# GitHub Container Registry Authentication Guide

This guide explains how to authenticate with GitHub Container Registry (ghcr.io) to push and pull Docker images for the GLSP Generator project.

## Prerequisites

- Docker installed and running
- GitHub account
- Repository access to push images

## Step 1: Create a Personal Access Token (PAT)

1. Go to GitHub Settings:
   - Click your profile picture → Settings
   - Navigate to "Developer settings" → "Personal access tokens" → "Tokens (classic)"

2. Click "Generate new token" → "Generate new token (classic)"

3. Configure the token:
   - **Note**: Give it a descriptive name like "GLSP Generator Docker"
   - **Expiration**: Choose an appropriate expiration (90 days recommended)
   - **Select scopes**:
     - ✅ `write:packages` - Upload packages to GitHub Package Registry
     - ✅ `read:packages` - Download packages from GitHub Package Registry
     - ✅ `delete:packages` - Delete packages from GitHub Package Registry (optional)
     - ✅ `repo` - If pushing images for private repositories

4. Click "Generate token" and **copy the token immediately** (you won't see it again!)

## Step 2: Authenticate with Docker

### Option A: Direct Authentication
```bash
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Replace:
- `YOUR_GITHUB_TOKEN` with your actual token
- `YOUR_GITHUB_USERNAME` with your GitHub username

### Option B: Using Environment Variable (Recommended)
```bash
# Set the token as an environment variable
export CR_PAT=YOUR_GITHUB_TOKEN

# Login using the environment variable
echo $CR_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### Option C: Store in .env File (For Development)
1. Create or update `.env` file in the project root:
```bash
GITHUB_TOKEN=YOUR_GITHUB_TOKEN
GITHUB_USERNAME=YOUR_GITHUB_USERNAME
```

2. Add to `.gitignore` if not already there:
```bash
echo ".env" >> .gitignore
```

3. Use in scripts:
```bash
source .env
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
```

## Step 3: Verify Authentication

Test that authentication worked:
```bash
docker pull ghcr.io/johnholliday/glsp-generator:latest
```

## Step 4: Push Images

Once authenticated, you can push images:
```bash
# Build and push
yarn docker:build
yarn docker:push

# Or push specific tags
docker push ghcr.io/johnholliday/glsp-generator:latest
docker push ghcr.io/johnholliday/glsp-generator:dev
docker push ghcr.io/johnholliday/glsp-generator:2.1.181
```

## Troubleshooting

### Permission Denied Error
```
error from registry: permission_denied: The token provided does not match expected scopes.
```
**Solution**: Ensure your PAT has the correct scopes (write:packages, read:packages)

### Unauthorized Error
```
unauthorized: authentication required
```
**Solution**: You need to login first using `docker login ghcr.io`

### Token Expired
```
unauthorized: Your token has expired
```
**Solution**: Generate a new PAT and login again

## GitHub Actions (CI/CD)

For automated builds in GitHub Actions, use the built-in `GITHUB_TOKEN`:

```yaml
- name: Login to GitHub Container Registry
  uses: docker/login-action@v2
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
```

## Security Best Practices

1. **Never commit tokens**: Always use environment variables or secrets
2. **Use minimal scopes**: Only grant the permissions you need
3. **Rotate tokens regularly**: Set expiration dates and rotate before they expire
4. **Use GitHub Actions secrets**: For CI/CD, use repository secrets
5. **Logout when done**: Run `docker logout ghcr.io` when finished

## Package Visibility

By default, packages inherit the visibility of their repository:
- Public repository → Public packages
- Private repository → Private packages

To change package visibility:
1. Go to your GitHub profile → Packages
2. Click on the package name
3. Click "Package settings"
4. Change visibility as needed

## Useful Commands

```bash
# List local images
docker images | grep glsp-generator

# Tag image for ghcr.io
docker tag glsp-generator:latest ghcr.io/johnholliday/glsp-generator:latest

# Push specific version
docker tag glsp-generator:latest ghcr.io/johnholliday/glsp-generator:2.1.181
docker push ghcr.io/johnholliday/glsp-generator:2.1.181

# Pull from registry
docker pull ghcr.io/johnholliday/glsp-generator:latest

# Logout when done
docker logout ghcr.io
```

## References

- [GitHub Container Registry Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Login Documentation](https://docs.docker.com/engine/reference/commandline/login/)
- [GitHub Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)