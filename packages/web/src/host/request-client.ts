import type {
  GameHostClient,
  HostGameSavesResult,
  HostAIConfigResult,
  HostConnectionResult,
  HostDeathArchiveResult,
  HostInventoryPinsLoadPayload,
  HostInventoryPinsPayload,
  HostInventoryPinsResult,
  HostInventoryPinsSaveResult,
  HostLoadGameByRunIdPayload,
  HostLoadGameResult,
  HostMessagePayload,
  HostMessageResult,
  HostNovelSearchResult,
  NovelSearchPayload,
  HostSaveGameResult,
  HostSettingsPayload,
  HostSettingsResult,
} from '@xianxia-rpg/core';
import { requestHost } from './host-request';

export function createRequestGameHostClient(): GameHostClient {
  return {
    sendMessage: async payload =>
      requestHost<HostMessageResult, HostMessagePayload>('/ai/message', { method: 'POST', body: payload })
        .catch(error => ({ success: false, reply: '', error: getErrorMessage(error) })),

    saveGame: async data =>
      requestHost<HostSaveGameResult>('/game/save', { method: 'POST', body: data })
        .catch(error => ({ success: false, message: getErrorMessage(error) })),

    loadGame: async () =>
      requestHost<HostLoadGameResult>('/game/latest', { method: 'GET' })
        .catch(error => ({ success: false, data: null, message: getErrorMessage(error) })),

    loadGameByRunId: async runId =>
      requestHost<HostLoadGameResult, HostLoadGameByRunIdPayload>('/game/load', { method: 'POST', body: { runId } })
        .catch(error => ({ success: false, data: null, message: getErrorMessage(error) })),

    listGameSaves: async () =>
      requestHost<HostGameSavesResult>('/game/saves', { method: 'GET' })
        .catch(error => ({ success: false, data: [], message: getErrorMessage(error) })),

    loadInventoryPins: async runId =>
      requestHost<HostInventoryPinsResult, HostInventoryPinsLoadPayload>(
        '/game/inventory-pins/load',
        { method: 'POST', body: { runId } },
      )
        .catch(error => ({ success: false, data: [], message: getErrorMessage(error) })),

    saveInventoryPins: async payload =>
      requestHost<HostInventoryPinsSaveResult, HostInventoryPinsPayload>('/game/inventory-pins', { method: 'POST', body: payload })
        .catch(error => ({ success: false, message: getErrorMessage(error) })),

    updateAIConfig: async config =>
      requestHost<HostSettingsResult, HostSettingsPayload>('/ai/config/runtime', { method: 'POST', body: config })
        .catch(error => ({ success: false, message: getErrorMessage(error) })),

    saveAIConfig: async config =>
      requestHost<HostSettingsResult, HostSettingsPayload>('/ai/config', { method: 'POST', body: config })
        .catch(error => ({ success: false, message: getErrorMessage(error) })),

    loadAIConfig: async () =>
      requestHost<HostAIConfigResult>('/ai/config', { method: 'GET' })
        .catch(error => ({ success: false, data: null, message: getErrorMessage(error) })),

    testAIConnection: async config =>
      requestHost<HostConnectionResult, HostSettingsPayload>('/ai/config/test', { method: 'POST', body: config })
        .catch(error => ({ success: false, error: getErrorMessage(error) })),

    saveDeathArchive: async data =>
      requestHost<HostDeathArchiveResult>('/game/death-archives', { method: 'POST', body: data })
        .catch(error => ({ success: false, message: getErrorMessage(error) })),

    searchNovels: async keyword =>
      requestHost<HostNovelSearchResult, NovelSearchPayload>('/novels/search', { method: 'POST', body: { keyword } })
        .catch(error => ({ success: false, data: [], message: getErrorMessage(error) })),
  };
}

function getErrorMessage(error: unknown): string {
  const message = String(error);
  return message.startsWith('Error: ') ? message.slice(7) : message;
}
