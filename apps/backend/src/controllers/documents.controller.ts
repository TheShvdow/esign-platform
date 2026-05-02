// src/controllers/documents.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  Request,
  ParseUUIDPipe,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { DocumentService } from '../services/document.service';
import {
  CreateDocumentDto,
  DocumentDto,
  SignDocumentDto,
} from '../dto/document.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AuthenticatedRequest, DocumentVerificationResult } from '../types/global.types';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private documentService: DocumentService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a new document' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Document uploaded successfully',
    type: DocumentDto,
  })
  async create(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: AuthenticatedRequest,
  ): Promise<DocumentDto> {
    return this.documentService.create(createDocumentDto, file, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    documents: DocumentDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.documentService.findAll(req.user, page, limit);
  }

  @Get(':id/download')
  @ApiOperation({
    summary: 'Download file',
    description:
      'Fichier stocké. Pour les PDF signés, une dernière page est ajoutée (certificat de signature : signataires, certificat, intégrité).',
  })
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<StreamableFile> {
    const { buffer, fileName, mimeType } = await this.documentService.getDownloadFile(
      id,
      req.user,
    );
    const safeAscii = fileName.replace(/[^\x20-\x7E]/g, '_');
    const encodedUtf8 = encodeURIComponent(fileName);
    return new StreamableFile(buffer, {
      type: mimeType,
      disposition: `attachment; filename="${safeAscii}"; filename*=UTF-8''${encodedUtf8}`,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({
    status: 200,
    description: 'Document retrieved successfully',
    type: DocumentDto,
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<DocumentDto> {
    return this.documentService.findById(id, req.user);
  }

  @Post(':id/sign')
  @ApiOperation({ summary: 'Sign a document' })
  @ApiResponse({
    status: 200,
    description: 'Document signed successfully',
    type: DocumentDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot sign document' })
  async signDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() signDto: SignDocumentDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<DocumentDto> {
    return this.documentService.signDocument(id, signDto, req.user, req);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Verify document signatures' })
  @ApiResponse({ status: 200, description: 'Document verification completed' })
  async verifyDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<DocumentVerificationResult> {
    return this.documentService.verifyDocument(id, req.user);
  }
}
