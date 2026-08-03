import { BRAND_SCENE_COPY } from './HippoCoinScene.utils';
import type { HippoCoinSceneProps } from './HippoCoinScene.types';
import { Coin, Hippo, SceneRoot } from './HippoCoinScene.styled';

/**
 * 브랜드 연출 — **아기 하마가 오른쪽 위의 금화를 올려다본다.**
 *
 * 브랜드 서사("배당을 먹고 자란다")를 그림 한 장으로 말한다. 하마는 입을 벌린 채 오른쪽 위를
 * 향하고 있고, 그 시선 끝에 금화가 뜬다 — 두 자산이 각자 있을 때는 없던 **관계**가 생긴다.
 *
 * ## 배치 근거 (원본 자산의 방향이 정한다)
 * `assets/brand/app_icon.png`(원본) 의 하마는 **주둥이가 오른쪽 위로 열려 있다.** 그래서 금화는 반드시 오른쪽 위다 —
 * 왼쪽이나 아래에 두면 하마가 엉뚱한 데를 보는 그림이 되어 연출이 깨진다.
 * 🔴 자산을 교체할 때 하마의 방향이 바뀌면 **이 배치를 함께 바꿔라.**
 *
 * ## 접근성
 * 🔴 **장식이다.** 이 그림이 없어도 화면의 정보는 하나도 줄지 않는다(옆의 제목·리드가 다 말한다).
 * 그래서 하마는 `alt=""`, 금화는 `aria-hidden` 이다. 여기에 설명을 붙이면 스크린리더 사용자는
 * 정보가 아닌 것을 정보로 받는다.
 * ⚠ 단, 이 부품을 **화면의 유일한 브랜드 표식**으로 쓰는 자리가 생기면 그때는 `label` 을 넘겨라.
 *
 * ## 성능
 * ⚠ 두 이미지가 합쳐 800KB 대다. 히어로는 첫 화면이라 `loading="eager"` 가 맞지만,
 *   **접힘 아래**에 쓸 때는 `lazy` 를 넘겨라 — 첫 페인트를 늦추면 이 그림의 값어치가 사라진다.
 */
export default function HippoCoinScene({ size = 240, loading = 'eager', label }: HippoCoinSceneProps) {
  return (
    <SceneRoot $size={size} role={label ? 'img' : undefined} aria-label={label}>
      <Hippo
        src="/hippo.png"
        // 하마는 어느 경우에도 장식이다 — 이름이 필요할 때는 무대(role=img)가 label 로 진다.
        alt=""
        width={size}
        height={size}
        loading={loading}
        decoding="async"
        draggable={false}
      />
      {/* 시선 끝의 금화. 하마와 겹치지 않게 오른쪽 위 바깥으로 살짝 나간다. */}
      <Coin
        src="/coin.png"
        alt=""
        aria-hidden="true"
        width={Math.round(size * 0.34)}
        height={Math.round(size * 0.34)}
        loading={loading}
        decoding="async"
        draggable={false}
      />
      {label ? null : <span hidden>{BRAND_SCENE_COPY.decorative}</span>}
    </SceneRoot>
  );
}
