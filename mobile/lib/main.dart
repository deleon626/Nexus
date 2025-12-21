import 'package:flutter/material.dart';
import 'services/supabase_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase
  final supabaseService = SupabaseService();
  await supabaseService.initialize();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Nexus QC',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const DataEntryScreen(),
    );
  }
}

class DataEntryScreen extends StatefulWidget {
  const DataEntryScreen({Key? key}) : super(key: key);

  @override
  State<DataEntryScreen> createState() => _DataEntryScreenState();
}

class _DataEntryScreenState extends State<DataEntryScreen> {
  List<String> _images = [];
  String _selectedImageType = 'scale_reading';
  final List<String> _chatMessages = [];
  final TextEditingController _messageController = TextEditingController();

  Future<void> _captureImage() async {
    // TODO: Implement camera capture
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Camera functionality coming soon')),
    );
  }

  void _sendMessage() {
    final message = _messageController.text;
    if (message.isEmpty) return;

    setState(() {
      _chatMessages.add('You: $message');
    });
    _messageController.clear();

    // TODO: Send to backend API
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Sending message to agent...')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('QC Data Entry'),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Image upload slots
          Container(
            height: 120,
            padding: const EdgeInsets.all(12),
            color: Colors.grey[100],
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: 2,
              itemBuilder: (context, index) {
                return GestureDetector(
                  onTap: _captureImage,
                  child: Container(
                    width: 100,
                    margin: const EdgeInsets.symmetric(horizontal: 6),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey),
                      borderRadius: BorderRadius.circular(8),
                      color: Colors.white,
                    ),
                    child: _images.length > index
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              _images[index],
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return const Icon(Icons.error);
                              },
                            ),
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: const [
                              Icon(Icons.add_a_photo, size: 32),
                              SizedBox(height: 8),
                              Text('Tap to capture', style: TextStyle(fontSize: 12)),
                            ],
                          ),
                  ),
                );
              },
            ),
          ),

          // Image type dropdown
          Padding(
            padding: const EdgeInsets.all(12),
            child: DropdownButton<String>(
              value: _selectedImageType,
              isExpanded: true,
              items: const [
                DropdownMenuItem(
                  value: 'scale_reading',
                  child: Text('Scale Reading'),
                ),
                DropdownMenuItem(
                  value: 'form_ocr',
                  child: Text('Form (OCR Parse)'),
                ),
                DropdownMenuItem(
                  value: 'label_barcode',
                  child: Text('Label/Barcode'),
                ),
                DropdownMenuItem(
                  value: 'custom',
                  child: Text('Custom'),
                ),
              ],
              onChanged: (value) {
                setState(() {
                  _selectedImageType = value ?? 'scale_reading';
                });
              },
            ),
          ),

          // Chat window
          Expanded(
            child: Container(
              color: Colors.white,
              child: ListView.builder(
                itemCount: _chatMessages.length,
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text(_chatMessages[index]),
                  );
                },
              ),
            ),
          ),

          // Input field
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey[300]!)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Type or speak corrections...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _sendMessage,
                  child: const Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }
}
