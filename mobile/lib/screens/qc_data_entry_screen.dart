import 'package:flutter/material.dart';

class QCDataEntryScreen extends StatefulWidget {
  const QCDataEntryScreen({Key? key}) : super(key: key);

  @override
  State<QCDataEntryScreen> createState() => _QCDataEntryScreenState();
}

class _QCDataEntryScreenState extends State<QCDataEntryScreen> {
  int _currentScreen = 0;
  bool _isRecording = false;
  final TextEditingController _messageController = TextEditingController();

  final List<String> screenNames = [
    'Empty State',
    'Image Uploaded',
    'Recording Voice',
    'Agent Processing',
    'Agent Response'
  ];

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('QC Data Entry'),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          // Screen selector
          Card(
            margin: const EdgeInsets.all(12),
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: List.generate(
                  screenNames.length,
                  (index) => ChoiceChip(
                    label: Text(screenNames[index]),
                    selected: _currentScreen == index,
                    onSelected: (selected) {
                      if (selected) {
                        setState(() => _currentScreen = index);
                      }
                    },
                  ),
                ),
              ),
            ),
          ),
          // Screen viewer
          Expanded(
            child: IndexedStack(
              index: _currentScreen,
              children: [
                _buildEmptyStateScreen(theme),
                _buildImageUploadedScreen(theme),
                _buildRecordingScreen(theme),
                _buildProcessingScreen(theme),
                _buildResponseScreen(theme),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // Screen 1: Empty State
  Widget _buildEmptyStateScreen(ThemeData theme) {
    return Column(
      children: [
        _buildHeader(theme),
        _buildImageSection(theme, showImage: false),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _buildSystemMessage('Session started'),
              const SizedBox(height: 16),
              _buildAgentMessage(
                theme,
                'Hello! I\'m ready to help you record QC data. Please capture a photo of the scale, then tell me what you\'d like to record.',
              ),
            ],
          ),
        ),
        _buildInputArea(theme, isRecording: false),
      ],
    );
  }

  // Screen 2: Image Uploaded
  Widget _buildImageUploadedScreen(ThemeData theme) {
    return Column(
      children: [
        _buildHeader(theme),
        _buildImageSection(theme, showImage: true),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _buildSystemMessage('Session started'),
              const SizedBox(height: 16),
              _buildAgentMessage(
                theme,
                'Hello! I\'m ready to help you record QC data.',
              ),
              const SizedBox(height: 16),
              _buildUserMessage(theme, 'Scale photo uploaded', showImage: true),
            ],
          ),
        ),
        _buildInputArea(theme, isRecording: false),
      ],
    );
  }

  // Screen 3: Recording
  Widget _buildRecordingScreen(ThemeData theme) {
    return Column(
      children: [
        _buildHeader(theme),
        _buildImageSection(theme, showImage: true),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _buildSystemMessage('Session started'),
              const SizedBox(height: 16),
              _buildAgentMessage(theme, 'Hello! I\'m ready to help you record QC data.'),
              const SizedBox(height: 16),
              _buildUserMessage(theme, 'Scale photo uploaded', showImage: true),
            ],
          ),
        ),
        _buildInputArea(theme, isRecording: true),
      ],
    );
  }

  // Screen 4: Processing
  Widget _buildProcessingScreen(ThemeData theme) {
    return Column(
      children: [
        _buildHeader(theme),
        _buildImageSection(theme, showImage: true),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _buildSystemMessage('Session started'),
              const SizedBox(height: 16),
              _buildAgentMessage(theme, 'Hello! I\'m ready to help you record QC data.'),
              const SizedBox(height: 16),
              _buildUserMessage(theme, 'Scale photo uploaded', showImage: true),
              const SizedBox(height: 16),
              _buildUserMessage(theme, 'Record this weight for Pond 3, batch SHP-2024-0892'),
              const SizedBox(height: 16),
              _buildAgentMessage(theme, null, showTyping: true),
            ],
          ),
        ),
        _buildInputArea(theme, isRecording: false),
      ],
    );
  }

  // Screen 5: Response
  Widget _buildResponseScreen(ThemeData theme) {
    return Column(
      children: [
        _buildHeader(theme),
        _buildImageSection(theme, showImage: true),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _buildSystemMessage('Session started'),
              const SizedBox(height: 16),
              _buildAgentMessage(theme, 'Hello! I\'m ready to help you record QC data.'),
              const SizedBox(height: 16),
              _buildUserMessage(theme, 'Scale photo uploaded', showImage: true),
              const SizedBox(height: 16),
              _buildUserMessage(theme, 'Record this weight for Pond 3, batch SHP-2024-0892'),
              const SizedBox(height: 16),
              _buildAgentMessage(
                theme,
                'I\'ve extracted the following data from your scale image and voice input:',
                showDataCard: true,
              ),
            ],
          ),
        ),
        _buildInputArea(theme, isRecording: false),
      ],
    );
  }

  // Header
  Widget _buildHeader(ThemeData theme) {
    return Card(
      margin: EdgeInsets.zero,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      child: ListTile(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text('New QC Report'),
        subtitle: const Text('Shrimp Harvest - Batch Entry'),
        trailing: IconButton(
          icon: const Icon(Icons.info_outline),
          onPressed: () {},
        ),
      ),
    );
  }

  // Image Section
  Widget _buildImageSection(ThemeData theme, {required bool showImage}) {
    return Card(
      margin: const EdgeInsets.all(12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Scale Image',
                  style: theme.textTheme.titleMedium,
                ),
                if (showImage)
                  Chip(
                    label: const Text('1 of 2'),
                    labelStyle: theme.textTheme.bodySmall,
                  ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildImageSlot(theme, showImage: showImage),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildImageSlot(theme, showImage: false, isOptional: true),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  // Image Slot
  Widget _buildImageSlot(ThemeData theme, {required bool showImage, bool isOptional = false}) {
    return AspectRatio(
      aspectRatio: 1,
      child: Card(
        color: showImage ? Colors.grey[900] : theme.colorScheme.surfaceVariant,
        child: InkWell(
          onTap: () {},
          child: showImage
              ? Stack(
                  alignment: Alignment.center,
                  children: [
                    const Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          '1,250',
                          style: TextStyle(
                            fontSize: 36,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          'kg',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white70,
                          ),
                        ),
                      ],
                    ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: CircleAvatar(
                        radius: 12,
                        backgroundColor: theme.colorScheme.primary,
                        child: const Icon(Icons.check, size: 16, color: Colors.white),
                      ),
                    ),
                  ],
                )
              : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      isOptional ? Icons.add : Icons.camera_alt,
                      size: 32,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      isOptional ? 'Optional' : 'Tap to capture',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  // System Message
  Widget _buildSystemMessage(String message) {
    return Center(
      child: Chip(
        label: Text(message),
        labelStyle: const TextStyle(fontSize: 12),
      ),
    );
  }

  // Agent Message
  Widget _buildAgentMessage(
    ThemeData theme,
    String? message, {
    bool showTyping = false,
    bool showDataCard = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        CircleAvatar(
          radius: 16,
          backgroundColor: theme.colorScheme.primary,
          child: const Icon(Icons.smart_toy, size: 16, color: Colors.white),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (message != null) Text(message),
                  if (showTyping)
                    Row(
                      children: List.generate(
                        3,
                        (i) => Container(
                          margin: const EdgeInsets.only(right: 4),
                          width: 8,
                          height: 8,
                          decoration: BoxDecoration(
                            color: theme.colorScheme.onSurfaceVariant,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ),
                  if (showDataCard) ...[
                    const SizedBox(height: 12),
                    Card(
                      color: theme.colorScheme.surfaceVariant,
                      child: Column(
                        children: [
                          ListTile(
                            dense: true,
                            title: const Text('Weight'),
                            trailing: const Text(
                              '1,250 kg',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                          ListTile(
                            dense: true,
                            title: const Text('Pond ID'),
                            trailing: const Text(
                              'Pond-03',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                          ListTile(
                            dense: true,
                            title: const Text('Batch Number'),
                            trailing: const Text(
                              'SHP-2024-0892',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    FilledButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.check_circle),
                      label: const Text('Review & Confirm'),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // User Message
  Widget _buildUserMessage(
    ThemeData theme,
    String message, {
    bool showImage = false,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Flexible(
          child: Card(
            color: theme.colorScheme.primaryContainer,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (showImage)
                    Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      color: Colors.grey[900],
                      child: const SizedBox(
                        width: 120,
                        height: 80,
                        child: Center(
                          child: Text(
                            '1,250',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                  Text(
                    message,
                    style: TextStyle(
                      color: theme.colorScheme.onPrimaryContainer,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // Input Area
  Widget _buildInputArea(ThemeData theme, {required bool isRecording}) {
    return Card(
      margin: EdgeInsets.zero,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.zero,
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      filled: true,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                FloatingActionButton.small(
                  backgroundColor: isRecording
                      ? theme.colorScheme.error
                      : theme.colorScheme.primary,
                  onPressed: () {
                    setState(() => _isRecording = !_isRecording);
                  },
                  child: Icon(
                    isRecording ? Icons.stop : Icons.mic,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              isRecording ? '🔴 Recording... Release to send' : 'Tap mic to speak',
              style: theme.textTheme.bodySmall?.copyWith(
                color: isRecording ? theme.colorScheme.error : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
