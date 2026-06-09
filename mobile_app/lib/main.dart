import 'dart:async';
import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  runApp(const WanfangExplorerApp());
}

const LatLng wanfangHospital = LatLng(24.99915, 121.55878);

class Quest {
  const Quest({
    required this.id,
    required this.title,
    required this.type,
    required this.kind,
    required this.icon,
    required this.position,
    required this.radiusMeters,
    required this.reward,
    required this.description,
  });

  final String id;
  final String title;
  final String type;
  final QuestKind kind;
  final String icon;
  final LatLng position;
  final double radiusMeters;
  final String reward;
  final String description;
}

enum QuestKind { hospital, metro, park, pharmacy, community }

const quests = <Quest>[
  Quest(
    id: 'hospital-gate',
    title: '萬芳醫院健康入口',
    type: '醫院任務',
    kind: QuestKind.hospital,
    icon: '+',
    position: wanfangHospital,
    radiusMeters: 60,
    reward: '醫療芽苗',
    description: '抵達醫院周邊後，查看今日門診、交通與樓層導引。',
  ),
  Quest(
    id: 'metro-start',
    title: '捷運萬芳醫院站起點',
    type: '交通任務',
    kind: QuestKind.metro,
    icon: 'M',
    position: LatLng(24.99815, 121.55803),
    radiusMeters: 50,
    reward: '通勤小隊員',
    description: '從捷運站出發，完成前往醫院入口的健康步行路線。',
  ),
  Quest(
    id: 'xinglong-walk',
    title: '興隆公園飯後散步',
    type: '步行任務',
    kind: QuestKind.park,
    icon: 'P',
    position: LatLng(25.00112, 121.55618),
    radiusMeters: 80,
    reward: '綠葉能量',
    description: '在公園周邊累積 800 步，完成飯後散步提醒。',
  ),
  Quest(
    id: 'pharmacy-supply',
    title: '社區藥局補給點',
    type: '照護任務',
    kind: QuestKind.pharmacy,
    icon: 'Rx',
    position: LatLng(24.99763, 121.56040),
    radiusMeters: 45,
    reward: '用藥徽章',
    description: '閱讀 30 秒用藥安全小卡，確認回家後的用藥提醒。',
  ),
  Quest(
    id: 'community-care',
    title: '里民健康小站',
    type: '社區任務',
    kind: QuestKind.community,
    icon: 'C',
    position: LatLng(25.00072, 121.56116),
    radiusMeters: 70,
    reward: '社區連結',
    description: '解鎖附近健康講座、篩檢活動與長照資源。',
  ),
  Quest(
    id: 'blood-pressure',
    title: '血壓紀錄提醒',
    type: '慢病任務',
    kind: QuestKind.hospital,
    icon: 'BP',
    position: LatLng(24.99884, 121.55742),
    radiusMeters: 55,
    reward: '穩定之星',
    description: '完成一次血壓紀錄，回診前累積自己的健康趨勢。',
  ),
  Quest(
    id: 'nutrition-card',
    title: '健康餐盤小卡',
    type: '衛教任務',
    kind: QuestKind.community,
    icon: 'N',
    position: LatLng(25.00003, 121.55503),
    radiusMeters: 60,
    reward: '均衡徽章',
    description: '看完一張糖尿病與高血壓友善飲食小卡。',
  ),
  Quest(
    id: 'return-visit',
    title: '回診前準備',
    type: '提醒任務',
    kind: QuestKind.hospital,
    icon: 'R',
    position: LatLng(24.99972, 121.55938),
    radiusMeters: 50,
    reward: '準備完成',
    description: '確認健保卡、藥袋、量測紀錄與檢查注意事項。',
  ),
];

class WanfangExplorerApp extends StatelessWidget {
  const WanfangExplorerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: '萬芳健康探索隊',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xff4e8fc7),
          primary: const Color(0xff2f7bb2),
          secondary: const Color(0xff3f8f66),
        ),
        fontFamily: 'sans',
        useMaterial3: true,
      ),
      home: const ExplorerHomePage(),
    );
  }
}

class ExplorerHomePage extends StatefulWidget {
  const ExplorerHomePage({super.key});

  @override
  State<ExplorerHomePage> createState() => _ExplorerHomePageState();
}

class _ExplorerHomePageState extends State<ExplorerHomePage> {
  GoogleMapController? _mapController;
  StreamSubscription<Position>? _positionSubscription;
  LatLng? _userPosition;
  LatLng? _lastStepPosition;
  Quest _selectedQuest = quests.first;
  Set<String> _completedQuestIds = <String>{};
  Set<Marker> _markers = <Marker>{};
  double _accuracyMeters = 0;
  double _walkedMeters = 0;
  bool _isTracking = false;
  bool _isLoadingMarkers = true;
  String _locationMessage = '尚未開始定位。';

  int get _estimatedSteps => (_walkedMeters / 0.75).round();

  bool get _isNearSelectedQuest {
    final user = _userPosition;
    if (user == null) return false;
    return _distanceMeters(user, _selectedQuest.position) <=
        _selectedQuest.radiusMeters;
  }

  @override
  void initState() {
    super.initState();
    _loadState();
    _buildQuestMarkers();
  }

  @override
  void dispose() {
    _positionSubscription?.cancel();
    _mapController?.dispose();
    super.dispose();
  }

  Future<void> _loadState() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _completedQuestIds =
          prefs.getStringList('completed_quest_ids')?.toSet() ?? <String>{};
      _walkedMeters = prefs.getDouble('walked_meters') ?? 0;
    });
  }

  Future<void> _saveState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(
      'completed_quest_ids',
      _completedQuestIds.toList(),
    );
    await prefs.setDouble('walked_meters', _walkedMeters);
  }

  Future<void> _buildQuestMarkers() async {
    final markerSet = <Marker>{};
    for (final quest in quests) {
      final icon = await _monsterMarker(quest);
      markerSet.add(
        Marker(
          markerId: MarkerId(quest.id),
          position: quest.position,
          title: quest.title,
          snippet: quest.type,
          icon: icon,
          anchor: const Offset(0.5, 0.9),
          onTap: () => _selectQuest(quest),
        ),
      );
    }
    if (!mounted) return;
    setState(() {
      _markers = markerSet;
      _isLoadingMarkers = false;
    });
  }

  Future<bool> _ensureLocationPermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      setState(() {
        _locationMessage = '定位服務尚未開啟，請先開啟手機定位。';
      });
      return false;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      setState(() {
        _locationMessage = '尚未取得定位權限，無法追蹤角色位置。';
      });
      return false;
    }
    return true;
  }

  Future<void> _toggleTracking() async {
    if (_isTracking) {
      await _positionSubscription?.cancel();
      setState(() {
        _isTracking = false;
        _locationMessage = '已停止追蹤。';
      });
      return;
    }

    final canLocate = await _ensureLocationPermission();
    if (!canLocate) return;

    final current = await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.best,
    );
    _handlePosition(current, moveCamera: true);

    _positionSubscription = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.best,
        distanceFilter: 2,
      ),
    ).listen(_handlePosition);

    setState(() {
      _isTracking = true;
    });
  }

  void _handlePosition(Position position, {bool moveCamera = false}) {
    final next = LatLng(position.latitude, position.longitude);
    final accuracy = position.accuracy;
    final last = _lastStepPosition;

    if (last != null && accuracy <= 80) {
      final delta = _distanceMeters(last, next);
      if (delta >= 2 && delta <= 60) {
        _walkedMeters += delta;
      }
    }

    _lastStepPosition = next;
    _userPosition = next;
    _accuracyMeters = accuracy;
    _locationMessage = accuracy <= 30
        ? 'GPS 精準度約 ${accuracy.round()}m，很適合測試任務觸發。'
        : '定位精準度約 ${accuracy.round()}m，若偏移可能是 Wi-Fi 或室內環境影響。';

    if (moveCamera) {
      _mapController?.animateCamera(CameraUpdate.newLatLngZoom(next, 17));
    }

    _saveState();
    setState(() {});
  }

  void _selectQuest(Quest quest) {
    setState(() {
      _selectedQuest = quest;
    });
    _mapController?.animateCamera(
      CameraUpdate.newLatLngZoom(quest.position, 17),
    );
  }

  void _simulateAtWanfang() {
    _handlePosition(
      Position(
        latitude: wanfangHospital.latitude,
        longitude: wanfangHospital.longitude,
        timestamp: DateTime.now(),
        accuracy: 15,
        altitude: 0,
        altitudeAccuracy: 0,
        heading: 0,
        headingAccuracy: 0,
        speed: 0,
        speedAccuracy: 0,
      ),
      moveCamera: true,
    );
  }

  void _toggleQuestDone() {
    final next = Set<String>.from(_completedQuestIds);
    if (next.contains(_selectedQuest.id)) {
      next.remove(_selectedQuest.id);
    } else {
      next.add(_selectedQuest.id);
    }
    setState(() {
      _completedQuestIds = next;
    });
    _saveState();
  }

  Set<Circle> _circles() {
    final circles = <Circle>{
      for (final quest in quests)
        Circle(
          circleId: CircleId('${quest.id}-radius'),
          center: quest.position,
          radius: quest.radiusMeters,
          strokeColor: const Color(0x773f8f66),
          strokeWidth: 1,
          fillColor: const Color(0x223f8f66),
        ),
    };

    final user = _userPosition;
    if (user != null && _accuracyMeters > 0) {
      circles.add(
        Circle(
          circleId: const CircleId('user-accuracy'),
          center: user,
          radius: _accuracyMeters,
          strokeColor: const Color(0x884e8fc7),
          strokeWidth: 2,
          fillColor: const Color(0x224e8fc7),
        ),
      );
    }
    return circles;
  }

  Marker? _userMarker() {
    final user = _userPosition;
    if (user == null) return null;
    return Marker(
      markerId: const MarkerId('current-user'),
      position: user,
      title: '目前位置',
      icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
      zIndex: 100,
    );
  }

  Set<Marker> _visibleMarkers() {
    final user = _userMarker();
    return {
      ..._markers,
      if (user != null) user,
    };
  }

  double _distanceMeters(LatLng a, LatLng b) {
    return Geolocator.distanceBetween(
      a.latitude,
      a.longitude,
      b.latitude,
      b.longitude,
    );
  }

  @override
  Widget build(BuildContext context) {
    final completedCount = _completedQuestIds.length;
    final user = _userPosition;
    final distanceToSelected = user == null
        ? null
        : _distanceMeters(user, _selectedQuest.position).round();

    return Scaffold(
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: const CameraPosition(
              target: wanfangHospital,
              zoom: 16,
            ),
            onMapCreated: (controller) {
              _mapController = controller;
              controller.setMapStyle(_mapStyle);
            },
            markers: _visibleMarkers(),
            circles: _circles(),
            myLocationButtonEnabled: false,
            myLocationEnabled: false,
            compassEnabled: false,
            mapToolbarEnabled: false,
            zoomControlsEnabled: false,
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _TopHud(
                    completedCount: completedCount,
                    totalCount: quests.length,
                    steps: _estimatedSteps,
                    walkedMeters: _walkedMeters,
                  ),
                  const Spacer(),
                  _QuestPanel(
                    quest: _selectedQuest,
                    completed: _completedQuestIds.contains(_selectedQuest.id),
                    isNear: _isNearSelectedQuest,
                    distanceMeters: distanceToSelected,
                    locationMessage: _locationMessage,
                    isTracking: _isTracking,
                    isLoadingMarkers: _isLoadingMarkers,
                    onTrackPressed: _toggleTracking,
                    onSimulatePressed: _simulateAtWanfang,
                    onCompletePressed: _toggleQuestDone,
                    onQuestPressed: _selectQuest,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TopHud extends StatelessWidget {
  const _TopHud({
    required this.completedCount,
    required this.totalCount,
    required this.steps,
    required this.walkedMeters,
  });

  final int completedCount;
  final int totalCount;
  final int steps;
  final double walkedMeters;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.92),
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(
            blurRadius: 24,
            color: Color(0x22000000),
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.explore, color: Color(0xff2f7bb2)),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '萬芳健康探索隊',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                Text(
                  '$completedCount / $totalCount 任務 · 約 $steps 步 · ${walkedMeters.round()}m',
                  style: const TextStyle(color: Color(0xff647067)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _QuestPanel extends StatelessWidget {
  const _QuestPanel({
    required this.quest,
    required this.completed,
    required this.isNear,
    required this.distanceMeters,
    required this.locationMessage,
    required this.isTracking,
    required this.isLoadingMarkers,
    required this.onTrackPressed,
    required this.onSimulatePressed,
    required this.onCompletePressed,
    required this.onQuestPressed,
  });

  final Quest quest;
  final bool completed;
  final bool isNear;
  final int? distanceMeters;
  final String locationMessage;
  final bool isTracking;
  final bool isLoadingMarkers;
  final VoidCallback onTrackPressed;
  final VoidCallback onSimulatePressed;
  final VoidCallback onCompletePressed;
  final ValueChanged<Quest> onQuestPressed;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.95),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            blurRadius: 30,
            color: Color(0x26000000),
            offset: Offset(0, 14),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Text(
                  quest.type,
                  style: const TextStyle(
                    color: Color(0xffd96f64),
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const Spacer(),
                if (isLoadingMarkers)
                  const SizedBox.square(
                    dimension: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              quest.title,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 8),
            Text(quest.description, style: const TextStyle(height: 1.45)),
            const SizedBox(height: 10),
            Text(
              distanceMeters == null
                  ? locationMessage
                  : '$locationMessage 距離此任務約 ${distanceMeters}m。',
              style: const TextStyle(color: Color(0xff647067)),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _Chip(text: '觸發 ${quest.radiusMeters.round()}m'),
                _Chip(text: '獎勵 ${quest.reward}'),
                _Chip(text: isNear ? '可觸發' : '尚未抵達'),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onTrackPressed,
                    icon: Icon(isTracking ? Icons.pause : Icons.my_location),
                    label: Text(isTracking ? '停止追蹤' : '開始追蹤'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onSimulatePressed,
                    icon: const Icon(Icons.place),
                    label: const Text('模擬萬芳'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            FilledButton.icon(
              onPressed: isNear || completed ? onCompletePressed : null,
              icon: Icon(completed ? Icons.undo : Icons.check_circle),
              label: Text(completed ? '取消完成' : '完成任務'),
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(46),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 76,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: quests.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final item = quests[index];
                  return ActionChip(
                    avatar: CircleAvatar(
                      backgroundColor: _kindColor(item.kind).withOpacity(0.18),
                      foregroundColor: _kindColor(item.kind),
                      child: Text(item.icon, style: const TextStyle(fontSize: 11)),
                    ),
                    label: Text(
                      item.title,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 12),
                    ),
                    onPressed: () => onQuestPressed(item),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xffe8f5ee),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        child: Text(
          text,
          style: const TextStyle(
            color: Color(0xff276447),
            fontSize: 12,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}

Future<BitmapDescriptor> _monsterMarker(Quest quest) async {
  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder);
  const size = 148.0;
  final paint = Paint()..isAntiAlias = true;
  final color = _kindColor(quest.kind);

  paint.color = const Color(0x33000000);
  canvas.drawOval(const Rect.fromLTWH(40, 132, 68, 15), paint);

  paint
    ..color = const Color(0xff2f4b42)
    ..strokeWidth = 8
    ..style = PaintingStyle.stroke
    ..strokeCap = StrokeCap.round;
  canvas.drawArc(const Rect.fromLTWH(38, 6, 52, 62), math.pi, 1.35, false, paint);

  paint
    ..style = PaintingStyle.fill
    ..color = const Color(0xfff6cf57);
  canvas.drawCircle(const Offset(44, 34), 10, paint);
  paint
    ..style = PaintingStyle.stroke
    ..strokeWidth = 4
    ..color = Colors.white;
  canvas.drawCircle(const Offset(44, 34), 10, paint);

  final bodyPath = Path()
    ..moveTo(31, 69)
    ..cubicTo(31, 28, 63, 15, 91, 23)
    ..cubicTo(117, 30, 132, 55, 125, 91)
    ..cubicTo(119, 124, 91, 140, 59, 132)
    ..cubicTo(35, 126, 26, 103, 31, 69)
    ..close();

  paint
    ..style = PaintingStyle.fill
    ..color = color;
  canvas.drawPath(bodyPath, paint);
  paint
    ..style = PaintingStyle.stroke
    ..strokeWidth = 8
    ..color = Colors.white;
  canvas.drawPath(bodyPath, paint);

  paint
    ..style = PaintingStyle.fill
    ..color = const Color(0x1f26312b);
  final shade = Path()
    ..moveTo(34, 91)
    ..cubicTo(51, 117, 90, 121, 120, 92)
    ..cubicTo(116, 122, 91, 140, 59, 132)
    ..cubicTo(40, 127, 31, 112, 34, 91)
    ..close();
  canvas.drawPath(shade, paint);

  paint.color = Colors.white;
  canvas.drawCircle(const Offset(64, 72), 12, paint);
  canvas.drawCircle(const Offset(99, 72), 12, paint);
  paint.color = const Color(0xff26312b);
  canvas.drawCircle(const Offset(68, 75), 5, paint);
  canvas.drawCircle(const Offset(96, 75), 5, paint);
  paint
    ..style = PaintingStyle.stroke
    ..strokeWidth = 7
    ..strokeCap = StrokeCap.round
    ..color = const Color(0xff26312b);
  canvas.drawArc(const Rect.fromLTWH(70, 84, 44, 26), 0.25, 1.7, false, paint);

  if (quest.kind == QuestKind.hospital) {
    paint
      ..style = PaintingStyle.fill
      ..color = Colors.white.withOpacity(0.92);
    canvas.drawRect(const Rect.fromLTWH(80, 35, 14, 42), paint);
    canvas.drawRect(const Rect.fromLTWH(66, 49, 42, 14), paint);
  }

  paint
    ..style = PaintingStyle.fill
    ..color = Colors.white.withOpacity(0.95);
  canvas.drawCircle(const Offset(112, 114), 25, paint);
  final paragraphStyle = ui.ParagraphStyle(textAlign: TextAlign.center);
  final textStyle = ui.TextStyle(
    color: quest.kind == QuestKind.pharmacy
        ? const Color(0xff4b3305)
        : _kindColor(quest.kind),
    fontSize: quest.icon.length > 1 ? 22 : 28,
    fontWeight: FontWeight.w800,
  );
  final paragraphBuilder = ui.ParagraphBuilder(paragraphStyle)
    ..pushStyle(textStyle)
    ..addText(quest.icon);
  final paragraph = paragraphBuilder.build()
    ..layout(const ui.ParagraphConstraints(width: 50));
  canvas.drawParagraph(paragraph, Offset(87, 100 + (quest.icon.length > 1 ? 1 : -1)));

  final picture = recorder.endRecording();
  final image = await picture.toImage(size.toInt(), size.toInt());
  final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
  return BitmapDescriptor.fromBytes(bytes!.buffer.asUint8List());
}

Color _kindColor(QuestKind kind) {
  return switch (kind) {
    QuestKind.hospital => const Color(0xffd96f64),
    QuestKind.metro => const Color(0xff4e8fc7),
    QuestKind.park => const Color(0xff3f8f66),
    QuestKind.pharmacy => const Color(0xfff4b84f),
    QuestKind.community => const Color(0xff6b7ec8),
  };
}

const _mapStyle = '''
[
  {"featureType":"poi.business","stylers":[{"visibility":"off"}]},
  {"featureType":"administrative","elementType":"geometry","stylers":[{"color":"#b7d5e6"}]},
  {"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#dff1fb"}]},
  {"featureType":"poi","elementType":"geometry","stylers":[{"color":"#d7edf8"}]},
  {"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#c9eadf"}]},
  {"featureType":"road","elementType":"geometry","stylers":[{"color":"#f7fbff"}]},
  {"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#c3dceb"}]},
  {"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#5f7583"}]},
  {"featureType":"transit","elementType":"geometry","stylers":[{"color":"#c4e3f5"}]},
  {"featureType":"water","elementType":"geometry","stylers":[{"color":"#a9d8f3"}]}
]
''';
