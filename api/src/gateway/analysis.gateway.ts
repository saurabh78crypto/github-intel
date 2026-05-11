import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import WebSocket from 'ws';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HistoryService } from '../history/history.service';

function friendlyError(raw: string): string {
  if (!raw) return 'Something went wrong. Please try again.';
  const lower = raw.toLowerCase();
  if (lower.includes('not found'))
    return "We couldn't find that GitHub username. Please double-check it and try again.";
  if (lower.includes('rate limit'))
    return 'GitHub is temporarily limiting requests. Please wait a minute and try again.';
  if (
    lower.includes('no public repositories') ||
    lower.includes('no public repos')
  )
    return 'This profile has no public repositories to analyse. Try a different username.';
  if (lower.includes('failed to score') || lower.includes('failed to generate'))
    return 'The AI analysis encountered an issue. Please try again.';
  if (lower.includes('timeout') || lower.includes('timed out'))
    return 'The request took too long. GitHub may be slow — please retry.';
  return 'Something went wrong during the analysis. Please try again.';
}

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class AnalysisGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AnalysisGateway.name);
  private activeConnections = new Map<string, WebSocket>();

  constructor(
    private historyService: HistoryService,
    private jwtService: JwtService,
  ) {}

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const aiWs = this.activeConnections.get(client.id);
    if (aiWs) {
      aiWs.terminate();
      this.activeConnections.delete(client.id);
      this.logger.log(`AI WS terminated for disconnected client=${client.id}`);
    }
  }

  private extractUserId(client: Socket): string | null {
    try {
      const cookieHeader = (client.handshake.headers.cookie as string) ?? '';
      const token = parseCookie(cookieHeader, 'token');
      if (!token) return null;
      const payload = this.jwtService.verify(token);
      return payload?.sub ?? null;
    } catch {
      return null;
    }
  }

  @SubscribeMessage('start_analysis')
  async handleAnalysis(
    @MessageBody() data: { username: string; target_role?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.extractUserId(client);
    const targetRole = data.target_role || 'Full Stack Engineer';

    this.logger.log(
      `Analysis started — client=${client.id} username=${data.username} role=${targetRole} userId=${userId ?? 'anonymous'}`,
    );

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'ws://localhost:8001/analyze';
    const aiWs = new WebSocket(aiServiceUrl);

    this.activeConnections.set(client.id, aiWs);

    aiWs.on('open', () => {
      this.logger.log(`AI WS connected for client=${client.id}`);
      aiWs.send(
        JSON.stringify({ username: data.username, target_role: targetRole })
      );
    });

    aiWs.on('message', async (raw: Buffer) => {
      if (!client.connected) {
        this.logger.warn(`Dropping AI message — client=${client.id} already disconnected`);
        return;
      }

      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        this.logger.error('Failed to parse AI WS message');
        return;
      }

      if (msg.error) {
        this.logger.warn(`AI service error for client=${client.id}: ${msg.error}`);
        client.emit('analysis_error', { error: friendlyError(msg.error) });
        this.activeConnections.delete(client.id);
        return;
      }

      if (msg.stage) {
        this.logger.debug(`Progress [${msg.stage}] ${msg.percent}% — ${msg.message}`);
        client.emit('analysis_progress', msg);
      }

      if (msg.result) {
        this.logger.log(
          `Analysis complete for client=${client.id} username=${msg.result.username}`,
        );

        try {
          const saved = await this.historyService.save(userId, msg.result);
          this.logger.log(`Report saved — id=${saved.id} userId=${userId ?? 'anonymous'}`);
          client.emit('analysis_complete', { ...msg.result, report_id: saved.id });
        } catch (e) {
          this.logger.error(`Failed to save report to DB: ${e}`);
          client.emit('analysis_error', {
            error: 'Analysis completed but we failed to save your report. Please try again.',
          });
        } finally {
          this.activeConnections.delete(client.id);
        }
      }
    });

    aiWs.on('error', (err) => {
      this.logger.error(`AI WS error for client=${client.id}: ${err.message}`);
      if (client.connected) {
        client.emit('analysis_error', {
          error: 'Our analysis engine is temporarily unavailable. Please try again in a moment.',
        });
      }
      this.activeConnections.delete(client.id);
    });

    aiWs.on('close', (code) => {
      this.logger.log(`AI WS closed for client=${client.id} code=${code}`);
      this.activeConnections.delete(client.id);
    });
  }
}
