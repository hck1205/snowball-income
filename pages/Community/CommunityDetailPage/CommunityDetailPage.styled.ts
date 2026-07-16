import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

export const Article = styled.article`
  max-width: 760px;
  margin: 0 auto;
`;

export const DetailHeader = styled.header`
  display: grid;
  gap: ${space[3]};
  margin-bottom: ${space[5]};
`;

export const HeaderTopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${space[3]};
`;

export const Title = styled.h1`
  margin: 0;
  color: ${color.text};
  font-size: clamp(${font.size['2xl']}, 4vw, ${font.size['3xl']});
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  word-break: break-word;
`;

export const OwnerActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  flex: 0 0 auto;
`;

export const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};

  b {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
  }

  time {
    color: ${color.textMuted};
  }

  .views {
    color: ${color.textMuted};
    ${font.numeric}
  }
`;

export const Dot = styled.span`
  color: ${color.textMuted};
`;

export const AttachCta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  flex-wrap: wrap;
  margin: ${space[6]} 0;
  padding: ${space[4]} ${space[5]};
  border-radius: ${radius.lg};
  border: 1px solid ${color.brandBorder};
  background: ${color.brandSubtle};
`;

export const AttachCtaInfo = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;

  strong {
    color: ${color.text};
    font-size: ${font.size.md};
    font-weight: ${font.weight.bold};
  }

  span {
    color: ${color.textSecondary};
    font-size: ${font.size.sm};
    ${font.numeric}
  }
`;

export const LikeRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  margin-top: ${space[6]};
`;

export const StateWrap = styled.div`
  max-width: 480px;
  margin: clamp(${space[6]}, 8vw, ${space[16]}) auto 0;
`;

export const BannerAction = styled.div`
  margin-top: ${space[3]};
`;
