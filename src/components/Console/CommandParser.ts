import type { CommandName } from '../../systems/StabilitySystem'

export interface ParsedCommand {
  command: CommandName
  target: string
  error?: string
}

const VALID_COMMANDS: Set<string> = new Set(['delete', 'clone', 'freeze', 'gravity'])

/**
 * Parses user input from the console.
 * Valid syntax:
 *   - command(target_id)
 *   - command
 *
 * If no target is specified, target defaults to the fallback target (the currently active target).
 */
export function parseCommand(input: string, activeTarget: string | null): ParsedCommand | { error: string } {
  const trimmed = input.trim()
  if (!trimmed) {
    return { error: 'EMPTY_INPUT' }
  }

  // Check for syntax like command(target)
  const match = trimmed.match(/^([a-zA-Z_0-9]+)\(([^)]*)\)$/)

  if (match) {
    const [, cmdName, targetName] = match
    const lowerCmd = cmdName.toLowerCase()

    if (!VALID_COMMANDS.has(lowerCmd)) {
      return { error: `UNKNOWN_COMMAND: ${cmdName}` }
    }

    const cleanedTarget = targetName.trim()
    if (!cleanedTarget) {
      // If they typed delete(), default to the active target
      if (!activeTarget) {
        return { error: 'NO_TARGET_SPECIFIED: Please specify a target, e.g. delete(building_01)' }
      }
      return { command: lowerCmd as CommandName, target: activeTarget }
    }

    return { command: lowerCmd as CommandName, target: cleanedTarget }
  }

  // Check for command without parentheses (e.g., "delete")
  const lowerCmd = trimmed.toLowerCase()
  if (VALID_COMMANDS.has(lowerCmd)) {
    if (!activeTarget) {
      return { error: `NO_TARGET_SPECIFIED: Target required for '${trimmed}'. Select a target or type ${trimmed}(target_id)` }
    }
    return { command: lowerCmd as CommandName, target: activeTarget }
  }

  return { error: `INVALID_SYNTAX: Command must be formatted as command(target) or command, e.g. delete(building_01)` }
}
