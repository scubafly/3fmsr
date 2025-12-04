# Use official Node.js LTS (Long Term Support) image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files (if you had any dependencies)
# For now we only use built-in Node.js modules, so we skip this

# Copy application files
COPY server.js .
COPY index.html .
COPY styles.css .
COPY app.js .
COPY README.md .

# Expose port 3000
EXPOSE 3000

# Health check to ensure container is running properly
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run the server
CMD ["node", "server.js"]
