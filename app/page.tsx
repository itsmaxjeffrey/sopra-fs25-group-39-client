"use client";
import "@ant-design/v5-patch-for-react-19";
import { useRouter } from "next/navigation";
import { Button, Typography, Layout } from "antd";
import Image from "next/image";
import styles from "./home.module.css";

const { Title, Paragraph } = Typography;
const { Header, Content, Footer } = Layout;

export default function Home() {
  const router = useRouter();

  return (
    <Layout className={styles.layout}>
      <Header className={styles.header}>
        <div className={styles.logo}>Züglig</div>
        <Button
          type="primary"
          className={styles.loginButton}
          onClick={() => router.push("/login")}
        >
          Login / Register
        </Button>
      </Header>

      <Content className={styles.content}>
        <div className={styles.hero}>
          <div className={styles.text}>
            <Title style={{ fontSize: '4rem', lineHeight: 1.2 }}>
              Your move. <br />
              <span style={{ color: '#22426b' }}>Easier than ever.</span>
            </Title>
            <Paragraph style={{ fontSize: '1.3rem', marginTop: '1rem' }}>
              🚛 ⁠Decentralizes logistics<br />
              💪 Promotes sharing economy
            </Paragraph>
            <Button
              type="primary"
              size="large"
              style={{ marginTop: '2rem' }}
              onClick={() => router.push("/login")}
            >
              Get started now
            </Button>
          </div>
          <div className={styles.image}>
            <Image
              src="/svg/moving-scene.svg"
              alt="Umzug Illustration"
              width={900}
              height={600}
              priority
            />
          </div>
        </div>
      </Content>

      <Footer className={styles.footer}>
        © {new Date().getFullYear()} Züglig – Your smart moving assistant
      </Footer>
    </Layout>
  );
}
