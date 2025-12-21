import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../utils/constants.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  factory SupabaseService() => _instance;
  SupabaseService._internal();

  late final SupabaseClient client;

  Future<void> initialize() async {
    await Supabase.initialize(
      url: AppConstants.supabaseUrl,
      anonKey: AppConstants.supabaseAnonKey,
    );
    client = Supabase.instance.client;
    print('✓ Supabase initialized');
  }

  Future<String> uploadImage(String path, List<int> bytes) async {
    final fileName = '${DateTime.now().millisecondsSinceEpoch}.jpg';
    await client.storage
        .from('report-images')
        .uploadBinary(fileName, Uint8List.fromList(bytes));

    return client.storage.from('report-images').getPublicUrl(fileName);
  }

  Future<List<Map<String, dynamic>>> fetchReports(String userId) async {
    final response = await client
        .from('reports')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', ascending: false);

    return response;
  }

  Stream<List<Map<String, dynamic>>> watchReports(String userId) {
    return client
        .from('reports')
        .stream(primaryKey: ['id'])
        .eq('created_by', userId)
        .order('created_at', ascending: false);
  }
}
