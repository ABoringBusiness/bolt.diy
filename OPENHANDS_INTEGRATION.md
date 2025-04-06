# OpenHands Integration for bolt.diy

This integration connects the UI/UX of bolt.diy with the backend of OpenHands, providing enhanced Git operations and server-side functionality.

## Overview

The integration allows bolt.diy to use either its built-in WebContainer for in-browser operations or the OpenHands backend for more powerful server-side operations. It automatically detects the availability of the OpenHands backend and switches between the two as needed.

## Features

- **Hybrid Git Operations**: Use WebContainer for local Git operations and OpenHands for server-side Git operations
- **Enhanced File Operations**: Access files beyond browser limitations
- **Server-Side Command Execution**: Run commands on the server
- **GitHub Integration**: Authenticate with GitHub and access repositories
- **Seamless UI Integration**: Maintain bolt.diy's fast and responsive UI

## Architecture

The integration consists of the following components:

1. **OpenHands API Client**: Communicates with the OpenHands backend API
2. **Git Service**: Provides Git operations using the OpenHands backend
3. **Hybrid Git Hook**: Automatically selects between WebContainer and OpenHands
4. **Settings UI**: Configure the OpenHands integration
5. **Status Indicator**: Shows the connection status to OpenHands

## Configuration

The OpenHands integration can be configured in the Settings panel under the "OpenHands" tab. The following settings are available:

- **API URL**: The URL of the OpenHands backend API
- **Connection Status**: Shows if the OpenHands backend is available
- **Feature Toggles**: Enable/disable specific OpenHands features

## Usage

When the OpenHands backend is available, bolt.diy will automatically use it for Git operations and other server-side functionality. If the OpenHands backend is not available, bolt.diy will fall back to using WebContainer for in-browser operations.

### Git Operations

Git operations like clone, push, and pull will automatically use the OpenHands backend when available. This provides several advantages:

- **Full Git Support**: Access to all Git commands and features
- **Authentication**: Support for GitHub authentication
- **Performance**: Faster Git operations for large repositories
- **Reliability**: More reliable Git operations, especially for complex operations

### File Operations

File operations will use the OpenHands backend when available, providing access to files beyond browser limitations.

### Command Execution

Command execution will use the OpenHands backend when available, allowing you to run commands on the server.

## Development

To develop the OpenHands integration, you'll need to run both bolt.diy and OpenHands:

1. Start the OpenHands backend:
   ```bash
   cd OpenHands
   python -m openhands.server.listen
   ```

2. Start bolt.diy with the OpenHands API URL:
   ```bash
   cd bolt-openhands-integration
   VITE_OPENHANDS_API_URL=http://localhost:8000 npm run dev
   ```

## Troubleshooting

If you encounter issues with the OpenHands integration, check the following:

1. Make sure the OpenHands backend is running and accessible
2. Check the API URL in the OpenHands settings
3. Check the browser console for error messages
4. Try refreshing the page to reconnect to the OpenHands backend

## License

This integration is licensed under the same license as bolt.diy and OpenHands.