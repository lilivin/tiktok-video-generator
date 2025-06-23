import React from 'react'
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Audio,
  Img,
  staticFile,
  Composition
} from 'remotion'
import type { QuizQuestion } from '../types/video.js'

interface QuizVideoProps {
  title: string
  questions: QuizQuestion[]
  backgrounds: string[]
  audioFiles: string[]
  width: number
  height: number
  fps: number
  durationPerQuestion: number
}

export const QuizVideo: React.FC<QuizVideoProps> = ({
  title,
  questions,
  backgrounds,
  audioFiles,
  durationPerQuestion
}) => {
  const { fps } = useVideoConfig()
  const framesPerQuestion = durationPerQuestion * fps

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Intro z tytułem */}
      <Sequence from={0} durationInFrames={fps * 2}>
        <IntroSequence title={title} />
      </Sequence>

      {/* Pytania */}
      {questions.map((question, index) => (
        <Sequence
          key={index}
          from={fps * 2 + index * framesPerQuestion}
          durationInFrames={framesPerQuestion}
        >
          <QuestionSequence
            question={question}
            backgroundImage={backgrounds[index]}
            audioFile={audioFiles[index]}
            index={index}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}

const IntroSequence: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const titleOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  const titleScale = spring({
    frame,
    fps,
    config: {
      damping: 200,
      stiffness: 100,
      mass: 0.5,
    },
  })

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px',
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: '72px',
          fontWeight: 'bold',
          textAlign: 'center',
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          textShadow: '0 4px 8px rgba(0,0,0,0.3)',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {title}
      </div>
    </AbsoluteFill>
  )
}

const QuestionSequence: React.FC<{
  question: QuizQuestion
  backgroundImage: string
  audioFile: string
  index: number
}> = ({ question, backgroundImage, audioFile, index }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Animacje
  const questionProgress = interpolate(frame, [0, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  const timerProgress = interpolate(frame, [60, 60 + fps * 3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  const answerReveal = interpolate(frame, [60 + fps * 3, 60 + fps * 4], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  })

  return (
    <AbsoluteFill>
      {/* Tło */}
      <AbsoluteFill>
        {backgroundImage.endsWith('.svg') ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          />
        ) : (
          <Img
            src={backgroundImage}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </AbsoluteFill>

      {/* Overlay */}
      <AbsoluteFill
        style={{
          background: 'rgba(0,0,0,0.4)',
        }}
      />

      {/* Zawartość */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          textAlign: 'center',
        }}
      >
        {/* Numer pytania */}
        <div
          style={{
            position: 'absolute',
            top: '60px',
            right: '60px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '50%',
            width: '80px',
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#333',
          }}
        >
          {index + 1}
        </div>

        {/* Pytanie */}
        <div
          style={{
            color: 'white',
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '80px',
            maxWidth: '800px',
            lineHeight: 1.2,
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            opacity: questionProgress,
            transform: `translateY(${(1 - questionProgress) * 50}px)`,
          }}
        >
          {question.question}
        </div>

        {/* Timer */}
        {timerProgress > 0 && timerProgress < 1 && (
          <div
            style={{
              fontSize: '120px',
              fontWeight: 'bold',
              color: '#ff6b6b',
              textShadow: '0 4px 8px rgba(0,0,0,0.8)',
              marginBottom: '40px',
            }}
          >
            {Math.ceil(3 * (1 - timerProgress))}
          </div>
        )}

        {/* Odpowiedź */}
        {answerReveal > 0 && (
          <div
            style={{
              color: '#4ecdc4',
              fontSize: '56px',
              fontWeight: 'bold',
              padding: '30px 60px',
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              opacity: answerReveal,
              transform: `scale(${0.8 + answerReveal * 0.2})`,
              color: '#333',
            }}
          >
            {question.answer}
          </div>
        )}
      </AbsoluteFill>

      {/* Audio */}
      {audioFile && (
        <Audio src={staticFile(audioFile)} />
      )}
    </AbsoluteFill>
  )
}

// Export domyślny dla Remotion
export default QuizVideo

// Konfiguracja kompozycji
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Główna kompozycja quizu */}
      <Composition
        id="QuizVideo"
        component={QuizVideo}
        durationInFrames={300} // 10 sekund przy 30fps
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: "Sample Quiz",
          questions: [
            { question: "Sample question?", answer: "Sample answer", image: null }
          ],
          backgrounds: [""],
          audioFiles: [""],
          width: 1080,
          height: 1920,
          fps: 30,
          durationPerQuestion: 10
        }}
      />
    </>
  )
} 