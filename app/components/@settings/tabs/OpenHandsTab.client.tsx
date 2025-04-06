/**
 * OpenHands Tab Component
 * 
 * This component provides a tab for configuring the OpenHands integration.
 */

import { ClientOnly } from 'remix-utils/client-only';
import { OpenHandsSettings } from '../OpenHandsSettings.client';

export function OpenHandsTab() {
  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">OpenHands Integration</h2>
        <p className="text-sm text-gray-500">
          Configure the integration with OpenHands backend for enhanced Git operations and server-side functionality.
        </p>
      </div>
      
      <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800">
        <ClientOnly>
          {() => <OpenHandsSettings />}
        </ClientOnly>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">About OpenHands</h3>
        <p className="text-sm">
          OpenHands is a powerful backend that provides Git operations, file management, and other server-side functionality.
          Integrating with OpenHands allows bolt.diy to perform operations that are not possible in the browser alone.
        </p>
        
        <h4 className="text-md font-semibold mt-4">Features</h4>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Full Git operations (clone, push, pull, etc.)</li>
          <li>Server-side command execution</li>
          <li>File operations beyond browser limitations</li>
          <li>Authentication and authorization</li>
          <li>Integration with GitHub and other services</li>
        </ul>
      </div>
    </div>
  );
}