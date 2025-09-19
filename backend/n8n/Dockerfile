# Use the official n8n image as base
FROM n8nio/n8n:latest

# Install netcat and curl for the entrypoint script
USER root
RUN apk add --no-cache netcat-openbsd curl

# Create the workflows directory as root first
RUN mkdir -p /workflows

# Copy workflow files and scripts
COPY workflows/ /workflows/

# Make the entrypoint script executable
RUN chmod +x /workflows/entrypoint.sh

# Switch to the n8n user
USER node

# Set the working directory
WORKDIR /home/node

# Create the n8n directory if it doesn't exist
RUN mkdir -p /home/node/.n8n

# Expose the n8n port
EXPOSE 5678

# Set the entrypoint
ENTRYPOINT ["/workflows/entrypoint.sh"]
