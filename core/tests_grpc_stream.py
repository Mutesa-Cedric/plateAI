"""In-process tests for private core gRPC streaming (no disk, mocked providers)."""
from __future__ import annotations

import os
import sys
import threading
import time
import unittest
from concurrent import futures
from io import BytesIO
from unittest.mock import patch

import grpc

CORE_DIR = os.path.dirname(os.path.abspath(__file__))
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)

from generated import ai_pb2, ai_pb2_grpc  # noqa: E402
from grpc_server import PlateAIServicer, AUDIO_CHUNK_SIZE  # noqa: E402


class GrpcStreamTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
        ai_pb2_grpc.add_PlateAIServicer_to_server(PlateAIServicer(), cls.server)
        # ephemeral port
        cls.port = cls.server.add_insecure_port("127.0.0.1:0")
        cls.server.start()
        cls.channel = grpc.insecure_channel(f"127.0.0.1:{cls.port}")
        cls.stub = ai_pb2_grpc.PlateAIStub(cls.channel)

    @classmethod
    def tearDownClass(cls):
        cls.channel.close()
        cls.server.stop(grace=None)

    def test_health(self):
        res = self.stub.Health(ai_pb2.HealthRequest())
        self.assertEqual(res.status, "ok")
        self.assertEqual(res.service, "core")

    def test_tts_streams_chunks_no_disk(self):
        fake_audio = b"A" * (AUDIO_CHUNK_SIZE * 2 + 100)
        with patch(
            "grpc_server.english_text_to_speech", return_value=fake_audio
        ) as m:
            chunks = list(
                self.stub.TextToSpeech(
                    ai_pb2.TtsRequest(text="hello world", language="en")
                )
            )
        m.assert_called_once_with("hello world")
        self.assertGreaterEqual(len(chunks), 3)
        self.assertEqual(chunks[0].content_type, "audio/mpeg")
        assembled = b"".join(c.data for c in chunks)
        self.assertEqual(assembled, fake_audio)

    def test_stt_client_stream_assembles_audio(self):
        # stream config + two audio frames
        def gen():
            yield ai_pb2.SttClientMessage(
                config=ai_pb2.SttConfig(
                    language="en",
                    content_type="audio/wav",
                    filename="a.wav",
                )
            )
            yield ai_pb2.SttClientMessage(audio=b"hello ")
            yield ai_pb2.SttClientMessage(audio=b"world")

        with patch(
            "grpc_server.english_speech_to_text", return_value="hello world"
        ) as m:
            res = self.stub.SpeechToText(gen())
        m.assert_called_once()
        args, kwargs = m.call_args
        self.assertEqual(args[0], b"hello world")
        self.assertEqual(res.text, "hello world")

    def test_chat_unary(self):
        with patch(
            "grpc_server.respond_prompt",
            return_value={"response": "eat veggies"},
        ):
            res = self.stub.Chat(ai_pb2.ChatRequest(prompt="tips?"))
        self.assertEqual(res.response, "eat veggies")

    def test_diet_check_json_roundtrip(self):
        payload = [{"food_item": "apple", "calories": "50"}]
        with patch("grpc_server.diet_check", return_value=payload):
            res = self.stub.DietCheck(ai_pb2.DietCheckRequest(base64="abc"))
        import json

        self.assertEqual(json.loads(res.result_json), payload)


if __name__ == "__main__":
    unittest.main(verbosity=2)
